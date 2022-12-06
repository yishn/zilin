use wasm_bindgen::prelude::wasm_bindgen;

use crate::{
  cedict::{CedictEntry, CEDICT_DATA},
  lookup_simplified, lookup_traditional, tokenize, Token,
};

#[wasm_bindgen(typescript_custom_section)]
const TYPESCRIPT_TYPES: &'static str = r#"
  export interface Token {
    value: string;
    offset: number;
    hasEntries: boolean;
  }

  export interface Entry {
    traditional: string;
    simplified: string;
    pinyin: string;
    english: string;
  }
"#;

#[wasm_bindgen(module = "/js/util.js")]
extern "C" {
  #[wasm_bindgen(typescript_type = "Token")]
  pub type JsToken;

  #[wasm_bindgen(typescript_type = "Entry")]
  pub type JsEntry;

  #[wasm_bindgen(js_namespace = console)]
  pub fn log(x: usize, y: usize);

  #[wasm_bindgen(js_name = "createToken")]
  fn create_token(value: &str, offset: usize, has_entries: bool) -> JsToken;

  #[wasm_bindgen(js_name = "createEntry")]
  fn create_entry(
    traditional: &str,
    simplified: &str,
    pinyin: &str,
    english: &str,
  ) -> JsEntry;
}

impl<'a> From<&'a Token> for JsToken {
  fn from(value: &'a Token) -> Self {
    create_token(&value.value, value.offset, value.has_entries)
  }
}

impl<'a> From<&'a CedictEntry> for JsEntry {
  fn from(value: &'a CedictEntry) -> Self {
    create_entry(
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
pub fn _lookup_simplified(word: &str) -> Vec<JsEntry> {
  lookup_simplified(word)
    .map(|entries| entries.iter().map(JsEntry::from).collect())
    .unwrap_or_default()
}

#[wasm_bindgen(js_name = "lookupTraditional")]
pub fn _lookup_traditional(word: &str) -> Vec<JsEntry> {
  lookup_traditional(word)
    .map(|entries| entries.iter().map(JsEntry::from).collect())
    .unwrap_or_default()
}

#[wasm_bindgen(start)]
pub fn _main() {
  let _ = &*CEDICT_DATA;
}
