use once_cell::sync::Lazy;
use wasm_bindgen::{prelude::wasm_bindgen, UnwrapThrowExt};

use crate::{
  character::{CharacterDecomposition, CharacterDictionary, CharacterEntry},
  word::{Token, WordDictionary, WordEntry},
};

static CEDICT_DATA: Lazy<WordDictionary> = Lazy::new(|| {
  WordDictionary::new(include_str!(
    "../../../data/cedict_1_0_ts_utf-8_mdbg.txt"
  ))
});

static CHARACTER_DATA: Lazy<CharacterDictionary> = Lazy::new(|| {
  CharacterDictionary::new(include_str!("../../../data/dictionary.txt"))
});

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
    | null
    | string
    | {
      type: string;
      value?: string;
      components: CharacterDecomposition[];
    };
"#;

#[wasm_bindgen(module = "/js/util.js")]
extern "C" {
  #[wasm_bindgen(typescript_type = "Token")]
  pub type JsToken;

  #[wasm_bindgen(typescript_type = "WordEntry")]
  pub type JsWordEntry;

  #[wasm_bindgen(typescript_type = "CharacterEntry")]
  pub type JsCharacterEntry;

  #[wasm_bindgen(typescript_type = "CharacterDecomposition")]
  pub type JsCharacterDecomposition;

  #[wasm_bindgen(js_name = "createToken")]
  fn create_token(value: &str, offset: usize, has_entries: bool) -> JsToken;

  #[wasm_bindgen(js_name = "createWordEntry")]
  fn create_word_entry(
    traditional: &str,
    simplified: &str,
    pinyin: &str,
    english: &str,
  ) -> JsWordEntry;

  #[wasm_bindgen(js_name = "createCharacterEntry")]
  fn create_character_entry(data: &str) -> JsCharacterEntry;

  #[wasm_bindgen(js_name = "createDecomposition")]
  fn create_decomposition(
    value: Option<char>,
    ty: Option<char>,
    parts: Vec<JsCharacterDecomposition>,
  ) -> JsCharacterDecomposition;
}

impl<'a> From<&'a Token> for JsToken {
  fn from(value: &'a Token) -> Self {
    create_token(&value.value, value.offset, value.has_entries)
  }
}

impl<'a> From<&'a WordEntry> for JsWordEntry {
  fn from(value: &'a WordEntry) -> Self {
    create_word_entry(
      &value.traditional,
      &value.simplified,
      &value.pinyin,
      &value.english,
    )
  }
}

impl<'a> From<&'a CharacterEntry> for JsCharacterEntry {
  fn from(value: &'a CharacterEntry) -> Self {
    create_character_entry(&serde_json::to_string(value).unwrap_throw())
  }
}

impl<'a> From<&'a CharacterDecomposition> for JsCharacterDecomposition {
  fn from(value: &'a CharacterDecomposition) -> Self {
    match value {
      CharacterDecomposition::Unknown => {
        create_decomposition(None, None, vec![])
      }
      CharacterDecomposition::Radical(value) => {
        create_decomposition(Some(*value), None, vec![])
      }
      CharacterDecomposition::Components {
        ty,
        value,
        components,
      } => create_decomposition(
        *value,
        Some(*ty),
        components
          .iter()
          .map(JsCharacterDecomposition::from)
          .collect(),
      ),
    }
  }
}

#[wasm_bindgen(js_name = "tokenize")]
pub fn _tokenize(input: &str) -> Vec<JsToken> {
  let tokens = CEDICT_DATA.tokenize(input);

  tokens.iter().map(JsToken::from).collect()
}

#[wasm_bindgen(js_name = "lookupSimplified")]
pub fn _lookup_simplified(word: &str) -> Vec<JsWordEntry> {
  CEDICT_DATA
    .get_simplified(word)
    .map(|entries| entries.iter().map(JsWordEntry::from).collect())
    .unwrap_or_default()
}

#[wasm_bindgen(js_name = "lookupTraditional")]
pub fn _lookup_traditional(word: &str) -> Vec<JsWordEntry> {
  CEDICT_DATA
    .get_traditional(word)
    .map(|entries| entries.iter().map(JsWordEntry::from).collect())
    .unwrap_or_default()
}

#[wasm_bindgen(js_name = "lookupSimplifiedIncludingSubslice")]
pub fn _lookup_simplified_including_subslice(
  slice: &str,
  limit: usize,
) -> Vec<JsWordEntry> {
  let mut result = CEDICT_DATA
    .iter_simplified_including_subslice(slice)
    .map(|entry| {
      (
        CHARACTER_DATA
          .stroke_count(&entry.simplified)
          .unwrap_or(usize::MAX),
        JsWordEntry::from(entry),
      )
    })
    .take(limit)
    .collect::<Vec<_>>();

  result.sort_by_key(|x| x.0);
  result.into_iter().map(|x| x.1).collect()
}

#[wasm_bindgen(js_name = "lookupTraditionalIncludingSubslice")]
pub fn _lookup_traditional_including_subslice(
  slice: &str,
  limit: usize,
) -> Vec<JsWordEntry> {
  let mut result = CEDICT_DATA
    .iter_traditional_including_subslice(slice)
    .map(|entry| {
      (
        CHARACTER_DATA
          .stroke_count(&entry.traditional)
          .unwrap_or(usize::MAX),
        JsWordEntry::from(entry),
      )
    })
    .take(limit)
    .collect::<Vec<_>>();

  result.sort_by_key(|x| x.0);
  result.into_iter().map(|x| x.1).collect()
}

#[wasm_bindgen(js_name = "lookupCharacter")]
pub fn _lookup_character(character: char) -> Option<JsCharacterEntry> {
  CHARACTER_DATA.get(character).map(JsCharacterEntry::from)
}

#[wasm_bindgen(js_name = "lookupSimplifiedCharactersIncludingComponent")]
pub fn _lookup_simplified_characters_including_component(
  component: char,
) -> Vec<JsCharacterEntry> {
  let mut result = CHARACTER_DATA
    .lookup_characters_including_component(component)
    .filter(|entry| {
      CEDICT_DATA
        .get_simplified(&entry.character.to_string())
        .is_some()
    })
    .map(|entry| {
      (
        CHARACTER_DATA
          .stroke_count(&entry.character.to_string())
          .unwrap_or(usize::MAX),
        JsCharacterEntry::from(entry),
      )
    })
    .collect::<Vec<_>>();

  result.sort_by_key(|x| x.0);
  result.into_iter().map(|x| x.1).collect()
}

#[wasm_bindgen(js_name = "lookupTraditionalCharactersIncludingComponent")]
pub fn _lookup_traditional_characters_including_component(
  component: char,
) -> Vec<JsCharacterEntry> {
  let mut result = CHARACTER_DATA
    .lookup_characters_including_component(component)
    .filter(|entry| {
      CEDICT_DATA
        .get_traditional(&entry.character.to_string())
        .is_some()
    })
    .map(|entry| {
      (
        CHARACTER_DATA
          .stroke_count(&entry.character.to_string())
          .unwrap_or(usize::MAX),
        JsCharacterEntry::from(entry),
      )
    })
    .collect::<Vec<_>>();

  result.sort_by_key(|x| x.0);
  result.into_iter().map(|x| x.1).collect()
}

#[wasm_bindgen(js_name = "decompose")]
pub fn _decompose(character: char) -> JsCharacterDecomposition {
  JsCharacterDecomposition::from(&CHARACTER_DATA.decompose(character))
}
