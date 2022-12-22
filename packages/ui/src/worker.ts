export type Tokenizer =
  typeof import("../../tokenizer/pkg/chinese_tokenizer.d.ts");

export interface RequestBody {
  id: number;
  fn: keyof Tokenizer;
  args?: unknown[];
}

export type ResponseBody =
  & { id: number }
  & ({
    err: Error;
    result?: undefined;
  } | {
    err?: undefined;
    result: unknown;
  });

const tokenizer = import(
  "../../tokenizer/pkg/chinese_tokenizer.js"
).then(async (t: Tokenizer) => {
  await t.default();
  return t;
});

globalThis.addEventListener(
  "message",
  async (
    evt: MessageEvent<RequestBody>,
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
