// @deno-types="../../tokenizer/pkg/chinese_tokenizer.d.ts"
import init, {
  Wasm as Tokenizer,
} from "../../tokenizer/pkg/chinese_tokenizer.js";

export type { Tokenizer };

export interface RequestBody {
  id: number;
  fn: keyof Tokenizer;
  args?: unknown[];
}

export type ResponseBody = { id: number } & (
  | {
      err: Error;
      result?: undefined;
    }
  | {
      err?: undefined;
      result: unknown;
    }
);

const tokenizer = init("../../tokenizer/pkg/chinese_tokenizer_bg.wasm").then(
  () =>
    new Tokenizer(
      fetch("../../../data/cedict_1_0_ts_utf-8_mdbg.txt").then((res) =>
        res.text()
      ),
      fetch("../../../data/dictionary.txt").then((res) => res.text())
    )
);

globalThis.addEventListener(
  "message",
  async (evt: MessageEvent<RequestBody>) => {
    try {
      const result = await (
        (
          await tokenizer
        )[evt.data.fn] as (...args: unknown[]) => unknown
      )(...(evt.data.args ?? []));

      postMessage({
        id: evt.data.id,
        result,
      });
    } catch (err) {
      postMessage({
        id: evt.data.id,
        err,
      });
    }
  }
);
