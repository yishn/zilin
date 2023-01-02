use std::{cell::RefCell, future::Future, pin::Pin, rc::Rc};

use js_sys::{Array, Promise};
use once_cell::unsync::OnceCell;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue, UnwrapThrowExt};
use wasm_bindgen_futures::JsFuture;

use crate::{
  character::{CharacterDecomposition, CharacterDictionary, CharacterEntry},
  word::{Token, WordDictionary, WordEntry},
  FrequencyDictionary, SentenceDictionary, WordDictionaryType,
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

  #[wasm_bindgen(typescript_type = "[entry: WordEntry, exact: boolean][]")]
  pub type JsWordEntryExactArray;

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

  #[wasm_bindgen(typescript_type = "[sentence: string, english: string][]")]
  pub type JsSentenceArray;
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

pub struct MaybeDone<T> {
  promise: RefCell<Option<Promise>>,
  f: Rc<dyn Fn(Result<JsValue, JsValue>) -> Pin<Box<dyn Future<Output = T>>>>,
  data: Rc<OnceCell<T>>,
}

impl<T> Clone for MaybeDone<T> {
  fn clone(&self) -> Self {
    Self {
      promise: self.promise.clone(),
      f: self.f.clone(),
      data: self.data.clone(),
    }
  }
}

impl<T> MaybeDone<T> {
  pub fn new(
    promise: Promise,
    f: impl Fn(Result<JsValue, JsValue>) -> Pin<Box<dyn Future<Output = T>>>
      + 'static,
  ) -> Self {
    Self {
      promise: RefCell::new(Some(promise)),
      f: Rc::new(f),
      data: Rc::new(OnceCell::new()),
    }
  }

  pub async fn get(&self) -> &T {
    if self.data.get().is_none() {
      let input = {
        let promise = self.promise.borrow().clone();

        JsFuture::from(promise.unwrap_throw()).await
      };

      if self.data.get().is_none() {
        let data = (self.f)(input).await;

        self.data.set(data).ok();
        *self.promise.borrow_mut() = None;
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
  sentences_dict: MaybeDone<SentenceDictionary>,
}

#[wasm_bindgen]
impl Worker {
  #[wasm_bindgen(constructor)]
  pub fn new(
    word_dict_data: Promise,
    character_dict_data: Promise,
    frequency_dict_data: Promise,
    sentences_dict_data: Promise,
  ) -> Self {
    let word_dict = MaybeDone::new(word_dict_data, |data| {
      Box::pin(async {
        let data = data
          .ok()
          .and_then(|data| data.as_string())
          .unwrap_or_default();

        WordDictionary::new(&data)
      })
    });

    let character_dict = MaybeDone::new(character_dict_data, |data| {
      Box::pin(async {
        let data = data
          .ok()
          .and_then(|data| data.as_string())
          .unwrap_or_default();

        CharacterDictionary::new(&data)
      })
    });

    let frequency_dict = MaybeDone::new(frequency_dict_data, |data| {
      Box::pin(async {
        let data = data
          .ok()
          .and_then(|data| data.as_string())
          .unwrap_or_default();

        FrequencyDictionary::new(&data)
      })
    });

    let sentences_dict = MaybeDone::new(sentences_dict_data, {
      let word_dict = word_dict.clone();

      move |data| {
        let word_dict = word_dict.clone();

        Box::pin(async move {
          let data = data
            .ok()
            .and_then(|data| data.as_string())
            .unwrap_or_default();

          SentenceDictionary::new(&data, word_dict.get().await)
        })
      }
    });

    Self {
      word_dict,
      character_dict,
      frequency_dict,
      sentences_dict,
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
      .collect::<Vec<_>>();

    result.sort_by_cached_key(|entry| {
      character_dictionary
        .stroke_count(if simplified {
          &entry.simplified
        } else {
          &entry.traditional
        })
        .unwrap_or(usize::MAX)
    });

    JsValue::from(
      result
        .into_iter()
        .take(limit)
        .map(JsWordEntry::from)
        .collect::<Array>(),
    )
    .into()
  }

  #[wasm_bindgen(js_name = "getHomophones")]
  pub async fn get_homophones(
    &self,
    word: &str,
    simplified: bool,
  ) -> JsWordEntryExactArray {
    let character_dictionary = self.character_dict.get().await;

    let mut result = self
      .word_dict
      .get()
      .await
      .iter_homophones(
        word,
        if simplified {
          WordDictionaryType::Simplified
        } else {
          WordDictionaryType::Traditional
        },
      )
      .collect::<Vec<_>>();

    result.sort_by_cached_key(|(entry, exact)| {
      (
        !*exact,
        character_dictionary
          .stroke_count(if simplified {
            &*entry.simplified
          } else {
            &*entry.traditional
          })
          .unwrap_or(usize::MAX),
      )
    });

    JsValue::from(
      result
        .into_iter()
        .map(|(entry, exact)| {
          serde_wasm_bindgen::to_value(&(entry, exact)).unwrap_throw()
        })
        .collect::<Array>(),
    )
    .into()
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
      .collect::<Vec<_>>();

    result.sort_by_cached_key(|entry| {
      character_dictionary
        .stroke_count(&entry.character.to_string())
        .unwrap_or(usize::MAX)
    });

    JsValue::from(
      result
        .into_iter()
        .map(JsCharacterEntry::from)
        .collect::<Array>(),
    )
    .into()
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
    let word_dict = self.word_dict.get().await;
    let frequency_dict = self.frequency_dict.get().await;

    JsValue::from(
      Array::from(&words)
        .iter()
        .filter_map(|word| word.as_string())
        .map(|word| {
          word_dict
            .get(&word, WordDictionaryType::Traditional)
            .or(word_dict.get(&word, WordDictionaryType::Simplified))
            .map(|entries| {
              entries
                .iter()
                .flat_map(|entry| [&*entry.simplified, &*entry.traditional])
            })
            .into_iter()
            .flatten()
            .find_map(|word| frequency_dict.get(word))
            .unwrap_or(0)
        })
        .map(JsValue::from)
        .collect::<Array>(),
    )
    .into()
  }

  #[wasm_bindgen(js_name = "getSentencesIncludingWord")]
  pub async fn get_sentences_including_word(
    &self,
    word: &str,
    limit: usize,
    simplified: bool,
  ) -> JsSentenceArray {
    let mut sentences = self
      .sentences_dict
      .get()
      .await
      .iter_sentences_including_word(
        word,
        if simplified {
          WordDictionaryType::Simplified
        } else {
          WordDictionaryType::Traditional
        },
      )
      .collect::<Vec<_>>();

    sentences.sort_by_key(|(sentence, _)| sentence.len());

    JsValue::from(
      sentences
        .into_iter()
        .take(limit)
        .map(|entry| serde_wasm_bindgen::to_value(&entry).unwrap_throw())
        .collect::<Array>(),
    )
    .into()
  }
}
