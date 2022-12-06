// @deno-types="../../tokenizer/pkg/chinese_tokenizer.d.ts"
import * as tokenizer from "../../tokenizer/pkg/chinese_tokenizer.js";

// deno-lint-ignore ban-types
const loadedMap = new WeakMap<object, Promise<void>>();

export async function loadTokenizer() {
  if (!loadedMap.has(tokenizer)) {
    loadedMap.set(
      tokenizer,
      tokenizer.default(
        "./packages/tokenizer/pkg/chinese_tokenizer_bg.wasm",
      ).then(() => {}),
    );
  }

  await loadedMap.get(tokenizer);
  return tokenizer;
}
