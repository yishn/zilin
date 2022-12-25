use js_sys::{Array, Promise};
use once_cell::unsync::OnceCell;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue, UnwrapThrowExt};
use wasm_bindgen_futures::JsFuture;

use crate::{
  character::{CharacterDecomposition, CharacterDictionary, CharacterEntry},
  word::{Token, WordDictionary, WordEntry},
  FrequencyDictionary, WordDictionaryType,
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

  #[wasm_bindgen(typescript_type = "string[]")]
  pub type JsStringArray;

  #[wasm_bindgen(typescript_type = "number[]")]
  pub type JsNumberArray;
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

#[derive(Debug, Clone)]
pub struct MaybeDone<T> {
  promise: Promise,
  f: fn(Result<JsValue, JsValue>) -> T,
  data: OnceCell<T>,
}

impl<T> MaybeDone<T> {
  pub fn new(promise: Promise, f: fn(Result<JsValue, JsValue>) -> T) -> Self {
    Self {
      promise,
      f,
      data: OnceCell::new(),
    }
  }

  pub async fn get(&self) -> &T {
    if self.data.get().is_none() {
      let input = JsFuture::from(self.promise.clone()).await;

      if self.data.get().is_none() {
        let data = (self.f)(input);

        self.data.set(data).ok().unwrap_throw();
      }
    }

    self.data.get().unwrap_throw()
  }
}

#[wasm_bindgen]
pub struct Worker {
  word_dict: MaybeDone<WordDictionary>,
  character_dict: MaybeDone<CharacterDictionary>,
  frequency_dict: MaybeDone<FrequencyDictionary>,
}

#[wasm_bindgen]
impl Worker {
  #[wasm_bindgen(constructor)]
  pub fn new(
    word_dict_data: Promise,
    character_dict_data: Promise,
    frequency_dict_data: Promise,
  ) -> Worker {
    Worker {
      word_dict: MaybeDone::new(word_dict_data, |data| {
        let data = data
          .ok()
          .and_then(|data| data.as_string())
          .unwrap_or_default();

        WordDictionary::new(&data)
      }),

      character_dict: MaybeDone::new(character_dict_data, |data| {
        let data = data
          .ok()
          .and_then(|data| data.as_string())
          .unwrap_or_default();

        CharacterDictionary::new(&data)
      }),

      frequency_dict: MaybeDone::new(frequency_dict_data, |data| {
        let data = data
          .ok()
          .and_then(|data| data.as_string())
          .unwrap_or_default();

        FrequencyDictionary::new(&data)
      }),
    }
  }

  pub async fn tokenize(&self, input: &str) -> JsTokenArray {
    let tokens = self.word_dict.get().await.tokenize(input);

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
        .word_dict
        .get()
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
    let character_dictionary = self.character_dict.get().await;

    let mut result = self
      .word_dict
      .get()
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
      .character_dict
      .get()
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
    let word_dictionary = self.word_dict.get().await;
    let character_dictionary = self.character_dict.get().await;

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
      &self.character_dict.get().await.decompose(character),
    )
  }

  #[wasm_bindgen(js_name = "getWordFrequencies")]
  pub async fn get_word_frequencies(
    &self,
    words: JsStringArray,
  ) -> JsNumberArray {
    let frequency_dict = self.frequency_dict.get().await;

    JsValue::from(
      Array::from(&words)
        .iter()
        .filter_map(|word| word.as_string())
        .map(|word| frequency_dict.get(&word) as f64)
        .map(JsValue::from)
        .collect::<Array>(),
    )
    .into()
  }
}
