use js_sys::{Array, Promise};
use once_cell::unsync::OnceCell;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue, UnwrapThrowExt};
use wasm_bindgen_futures::JsFuture;

use crate::{
  character::{CharacterDecomposition, CharacterDictionary, CharacterEntry},
  word::{Token, WordDictionary, WordEntry},
  WordDictionaryType,
};

#[wasm_bindgen(typescript_custom_section)]
const TYPESCRIPT_TYPES: &'static str = r#"
  export interface Token {
    value: string;
    offset: number;
    hasEntries: boolean;
  }

  export interface WordEntry {
    traditional: string;
    simplified: string;
    pinyin: string;
    english: string;
  }

  export interface CharacterEntry {
    character: string;
    definition?: string;
    pinyin: string[];
    etymology?:
      | {
        type: "ideographic" | "pictographic";
        hint: string;
      }
      | {
        type: "pictophonetic";
        hint?: string;
        phonetic?: string;
        semantic?: string;
      };
    strokes: number;
  }

  export type CharacterDecomposition =
    | undefined
    | string
    | {
      type: string;
      value?: string;
      components: CharacterDecomposition[];
    };
"#;

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(typescript_type = "Token")]
  pub type JsToken;

  #[wasm_bindgen(typescript_type = "Token[]")]
  pub type JsTokenArray;

  #[wasm_bindgen(typescript_type = "WordEntry")]
  pub type JsWordEntry;

  #[wasm_bindgen(typescript_type = "WordEntry[]")]
  pub type JsWordEntryArray;

  #[wasm_bindgen(typescript_type = "CharacterEntry")]
  pub type JsCharacterEntry;

  #[wasm_bindgen(typescript_type = "CharacterEntry[]")]
  pub type JsCharacterEntryArray;

  #[wasm_bindgen(typescript_type = "CharacterDecomposition")]
  pub type JsCharacterDecomposition;
}

impl<'a> From<&'a Token> for JsToken {
  fn from(value: &'a Token) -> Self {
    serde_wasm_bindgen::to_value(value).unwrap_throw().into()
  }
}

impl<'a> From<&'a WordEntry> for JsWordEntry {
  fn from(value: &'a WordEntry) -> Self {
    serde_wasm_bindgen::to_value(value).unwrap_throw().into()
  }
}

impl<'a> From<&'a CharacterEntry> for JsCharacterEntry {
  fn from(value: &'a CharacterEntry) -> Self {
    serde_wasm_bindgen::to_value(value).unwrap_throw().into()
  }
}

impl<'a> From<&'a CharacterDecomposition> for JsCharacterDecomposition {
  fn from(value: &'a CharacterDecomposition) -> Self {
    serde_wasm_bindgen::to_value(value).unwrap_throw().into()
  }
}

#[wasm_bindgen]
pub struct Worker {
  word_dict: (Promise, OnceCell<WordDictionary>),
  character_dict: (Promise, OnceCell<CharacterDictionary>),
}

#[wasm_bindgen]
impl Worker {
  #[wasm_bindgen(constructor)]
  pub fn new(word_dict_data: Promise, character_dict_data: Promise) -> Worker {
    Worker {
      word_dict: (word_dict_data, OnceCell::new()),
      character_dict: (character_dict_data, OnceCell::new()),
    }
  }

  async fn get_word_dictionary(&self) -> &WordDictionary {
    if self.word_dict.1.get().is_none() {
      let data = JsFuture::from(self.word_dict.0.clone())
        .await
        .ok()
        .and_then(|result| result.as_string())
        .unwrap_or_default();

      self.word_dict.1.set(WordDictionary::new(&data)).ok();
    }

    self.word_dict.1.get().unwrap_throw()
  }

  async fn get_character_dictionary(&self) -> &CharacterDictionary {
    if self.character_dict.1.get().is_none() {
      let data = JsFuture::from(self.character_dict.0.clone())
        .await
        .ok()
        .and_then(|result| result.as_string())
        .unwrap_or_default();

      self
        .character_dict
        .1
        .set(CharacterDictionary::new(&data))
        .ok();
    }

    self.character_dict.1.get().unwrap_throw()
  }

  pub async fn tokenize(&self, input: &str) -> JsTokenArray {
    let tokens = self.get_word_dictionary().await.tokenize(input);

    JsValue::from(tokens.iter().map(JsToken::from).collect::<Array>()).into()
  }

  #[wasm_bindgen(js_name = "getWord")]
  pub async fn get_word(
    &self,
    word: &str,
    simplified: bool,
  ) -> JsWordEntryArray {
    JsValue::from(
      self
        .get_word_dictionary()
        .await
        .get(
          word,
          if simplified {
            WordDictionaryType::Simplified
          } else {
            WordDictionaryType::Traditional
          },
        )
        .map(|entries| entries.iter().map(JsWordEntry::from).collect::<Array>())
        .unwrap_or_default(),
    )
    .into()
  }

  #[wasm_bindgen(js_name = "getWordsIncludingSubslice")]
  pub async fn get_words_including_subslice(
    &self,
    slice: &str,
    limit: usize,
    simplified: bool,
  ) -> JsWordEntryArray {
    let character_dictionary = self.get_character_dictionary().await;

    let mut result = self
      .get_word_dictionary()
      .await
      .iter_including_subslice(
        slice,
        if simplified {
          WordDictionaryType::Simplified
        } else {
          WordDictionaryType::Traditional
        },
      )
      .map(|entry| {
        (
          character_dictionary
            .stroke_count(if simplified {
              &entry.simplified
            } else {
              &entry.traditional
            })
            .unwrap_or(usize::MAX),
          JsWordEntry::from(entry),
        )
      })
      .take(limit)
      .collect::<Vec<_>>();

    result.sort_by_key(|x| x.0);
    JsValue::from(result.into_iter().map(|x| x.1).collect::<Array>()).into()
  }

  #[wasm_bindgen(js_name = "getCharacter")]
  pub async fn get_character(
    &self,
    character: char,
  ) -> Option<JsCharacterEntry> {
    self
      .get_character_dictionary()
      .await
      .get(character)
      .map(JsCharacterEntry::from)
  }

  #[wasm_bindgen(js_name = "getCharactersIncludingComponent")]
  pub async fn get_characters_including_component(
    &self,
    component: char,
    simplified: bool,
  ) -> JsCharacterEntryArray {
    let word_dictionary = self.get_word_dictionary().await;
    let character_dictionary = self.get_character_dictionary().await;

    let mut result = character_dictionary
      .get_characters_including_component(component)
      .filter(|entry| {
        word_dictionary
          .get(
            &entry.character.to_string(),
            if simplified {
              WordDictionaryType::Simplified
            } else {
              WordDictionaryType::Traditional
            },
          )
          .is_some()
      })
      .map(|entry| {
        (
          character_dictionary
            .stroke_count(&entry.character.to_string())
            .unwrap_or(usize::MAX),
          JsCharacterEntry::from(entry),
        )
      })
      .collect::<Vec<_>>();

    result.sort_by_key(|x| x.0);
    JsValue::from(result.into_iter().map(|x| x.1).collect::<Array>()).into()
  }

  #[wasm_bindgen(js_name = "decompose")]
  pub async fn decompose(&self, character: char) -> JsCharacterDecomposition {
    JsCharacterDecomposition::from(
      &self.get_character_dictionary().await.decompose(character),
    )
  }
}
