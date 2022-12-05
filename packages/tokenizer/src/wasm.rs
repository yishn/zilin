use wasm_bindgen::prelude::wasm_bindgen;

use crate::{
  cedict::{CedictEntry, CEDICT_DATA},
  lookup_simplified, tokenize, lookup_traditional,
};

#[wasm_bindgen(typescript_custom_section)]
const TYPESCRIPT_TYPES: &'static str = r#"
  export interface Token {
    value: string;
    offset: number;
    line: number;
    column: number;
    entries: Entry[];
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
  pub type Token;

  #[wasm_bindgen(typescript_type = "Entry")]
  pub type Entry;

  #[wasm_bindgen(js_name = "createToken")]
  fn create_token(
    value: &str,
    offset: usize,
    line: usize,
    column: usize,
    entries: Vec<Entry>,
  ) -> Token;

  #[wasm_bindgen(js_name = "createEntry")]
  fn create_entry(
    traditional: &str,
    simplified: &str,
    pinyin: &str,
    english: &str,
  ) -> Entry;
}

impl<'a> From<&'a CedictEntry> for Entry {
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
pub fn _tokenize(input: &str) -> Vec<Token> {
  let tokens = tokenize(input);

  tokens
    .into_iter()
    .map(|token| {
      create_token(
        &token.value,
        token.offset,
        token.line,
        token.column,
        token
          .entries
          .map(|entries| entries.iter().map(Entry::from).collect())
          .unwrap_or_default(),
      )
    })
    .collect()
}

#[wasm_bindgen(js_name = "lookupSimplified")]
pub fn _lookup_simplified(word: &str) -> Vec<Entry> {
  lookup_simplified(word)
    .map(|entries| entries.iter().map(Entry::from).collect())
    .unwrap_or_default()
}

#[wasm_bindgen(js_name = "lookupTraditional")]
pub fn _lookup_traditional(word: &str) -> Vec<Entry> {
  lookup_traditional(word)
    .map(|entries| entries.iter().map(Entry::from).collect())
    .unwrap_or_default()
}

#[wasm_bindgen(start)]
pub fn _main() {
  let _ = &*CEDICT_DATA;
}
