export type Tokenizer =
  typeof import("../../tokenizer/pkg/chinese_tokenizer.d.ts");

export interface MessageBody {
  id: number;
  fn: keyof Tokenizer;
  args?: unknown[];
}

export interface ResponseBody {
  id: number;
  err?: Error;
  // deno-lint-ignore no-explicit-any
  result?: any;
}

const tokenizer = import(
  "../../tokenizer/pkg/chinese_tokenizer.js"
).then(async (t: Tokenizer) => {
  await t.default();
  return t;
});

globalThis.addEventListener(
  "message",
  async (
    evt: MessageEvent<MessageBody>,
  ) => {
    try {
      const result =
        ((await tokenizer)[evt.data.fn] as (...args: unknown[]) => unknown)(
          ...evt.data.args ?? [],
        );

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
  },
);
