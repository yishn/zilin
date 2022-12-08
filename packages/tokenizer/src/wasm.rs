use wasm_bindgen::prelude::wasm_bindgen;

use crate::{
  cedict::WordEntry, character::CHARACTER_DATA, lookup_simplified,
  lookup_traditional, tokenize, Token,
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
    decomposition: string;
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
  }
"#;

#[wasm_bindgen(module = "/js/util.js")]
extern "C" {
  #[wasm_bindgen(typescript_type = "Token")]
  pub type JsToken;

  #[wasm_bindgen(typescript_type = "WordEntry")]
  pub type JsWordEntry;

  #[wasm_bindgen(typescript_type = "CharacterEntry")]
  pub type JsCharacterEntry;

  #[wasm_bindgen(js_namespace = console)]
  pub fn log(x: usize, y: usize);

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

#[wasm_bindgen(js_name = "tokenize")]
pub fn _tokenize(input: &str) -> Vec<JsToken> {
  let tokens = tokenize(input);

  tokens.iter().map(JsToken::from).collect()
}

#[wasm_bindgen(js_name = "lookupSimplified")]
pub fn _lookup_simplified(word: &str) -> Vec<JsWordEntry> {
  lookup_simplified(word)
    .map(|entries| entries.iter().map(JsWordEntry::from).collect())
    .unwrap_or_default()
}

#[wasm_bindgen(js_name = "lookupTraditional")]
pub fn _lookup_traditional(word: &str) -> Vec<JsWordEntry> {
  lookup_traditional(word)
    .map(|entries| entries.iter().map(JsWordEntry::from).collect())
    .unwrap_or_default()
}

#[wasm_bindgen(js_name = "lookupCharacter")]
pub fn _lookup_character(character: char) -> Option<JsCharacterEntry> {
  CHARACTER_DATA.get(character).map(create_character_entry)
}
