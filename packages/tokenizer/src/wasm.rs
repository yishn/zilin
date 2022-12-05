use wasm_bindgen::prelude::wasm_bindgen;

use crate::{cedict::CEDICT_DATA, tokenize};

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
          .map(|entries| {
            entries
              .into_iter()
              .map(|entry| {
                create_entry(
                  &entry.traditional,
                  &entry.simplified,
                  &entry.pinyin,
                  &entry.english,
                )
              })
              .collect()
          })
          .unwrap_or_default(),
      )
    })
    .collect()
}

#[wasm_bindgen(start)]
pub fn _main() {
  let _ = &*CEDICT_DATA;
}
