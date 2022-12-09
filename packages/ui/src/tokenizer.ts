import type { MessageBody, ResponseBody, Tokenizer } from "./worker.ts";

type PromisifiedTokenizer = {
  [K in keyof Tokenizer]: (
    ...args: Parameters<Tokenizer[K]>
  ) => Promise<ReturnType<Tokenizer[K]>>;
};

const worker = new Worker("./packages/ui/dist/worker.js", { type: "module" });

let id = 0;
let tokenizer: PromisifiedTokenizer | undefined;

export function loadTokenizer(): PromisifiedTokenizer {
  if (tokenizer != null) return tokenizer;

  return tokenizer = new Proxy({}, {
    get(_, key) {
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

          worker.postMessage({
            id: currentId,
            fn: key,
            args,
          } as MessageBody);
        });
    },
  }) as PromisifiedTokenizer;
}
