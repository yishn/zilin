// @deno-types="../../tokenizer/pkg/chinese_tokenizer.d.ts"
import * as tokenizer from "../../tokenizer/pkg/chinese_tokenizer.js";

// deno-lint-ignore ban-types
const loadedMap = new WeakMap<object, boolean>();

export async function loadTokenizer() {
  if (!loadedMap.get(tokenizer)) {
    await tokenizer.default(
      "./packages/tokenizer/pkg/chinese_tokenizer_bg.wasm",
    );
    loadedMap.set(tokenizer, true);
  }

  return tokenizer;
}
