import type { RequestBody, ResponseBody, Tokenizer } from "./worker.ts";

type PromisifiedTokenizer = {
  [K in keyof Tokenizer]: (
    ...args: Parameters<Tokenizer[K]>
  ) => Promise<Awaited<ReturnType<Tokenizer[K]>>>;
};

const worker = new Worker("./packages/ui/dist/worker.js", { type: "module" });

let id = 0;
let tokenizer: PromisifiedTokenizer;

export function getTokenizer(): PromisifiedTokenizer {
  if (tokenizer != null) return tokenizer;

  return (tokenizer = new Proxy(
    {},
    {
      get(_, key: keyof Tokenizer) {
        return (...args: unknown[]) =>
          new Promise((resolve, reject) => {
            const currentId = id++;

            const handleMessage = (evt: MessageEvent<ResponseBody>) => {
              if (evt.data.id === currentId) {
                worker.removeEventListener("message", handleMessage);

                if (evt.data.err != null) reject(evt.data.err);
                else resolve(evt.data.result);
              }
            };

            worker.addEventListener("message", handleMessage);

            const msg: RequestBody = {
              id: currentId,
              fn: key,
              args,
            };

            worker.postMessage(msg);
          });
      },
    }
  ) as PromisifiedTokenizer);
}
