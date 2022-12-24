import type {
  RequestBody,
  ResponseBody,
  Worker as WasmWorker,
} from "../../worker/src/main.ts";

export * from "../../worker/pkg/zilin_worker.d.ts"

type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any
    ? (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>>
    : never;
};

const worker = new Worker("./packages/worker/dist/main.js", {
  type: "module",
});

let wasmWorker: Promisified<WasmWorker>;

export function getWasmWorker(): Promisified<WasmWorker> {
  if (wasmWorker != null) return wasmWorker;

  let id = 0;

  return (wasmWorker = new Proxy(
    {},
    {
      get(_, key: keyof WasmWorker) {
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
  ) as Promisified<WasmWorker>);
}
