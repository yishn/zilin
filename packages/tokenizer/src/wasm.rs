use js_sys::{Array, Object};
use wasm_bindgen::prelude::wasm_bindgen;

use crate::{tokenize, cedict::CEDICT_DATA};

#[wasm_bindgen(module = "/js/util.js")]
extern "C" {
  #[wasm_bindgen(js_name = "createToken")]
  fn create_token(
    value: &str,
    offset: usize,
    line: usize,
    column: usize,
    entries: Array,
  ) -> Object;

  #[wasm_bindgen(js_name = "createEntry")]
  fn create_entry(
    traditional: &str,
    simplified: &str,
    pinyin: &str,
    english: &str,
  ) -> Object;
}

#[wasm_bindgen(js_name = "tokenize")]
pub fn _tokenize(input: &str) -> Array {
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
