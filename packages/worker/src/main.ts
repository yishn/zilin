// @deno-types="../pkg/zilin_worker.d.ts"
import init, { Worker } from "../pkg/zilin_worker.js";

export type { Worker };

export interface RequestBody {
  id: number;
  fn: keyof Worker;
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

const cedictData = fetch("../../../data/cedict_1_0_ts_utf-8_mdbg.txt").then(
  (res) => res.text()
);

const characterData = fetch("../../../data/dictionary.txt").then((res) =>
  res.text()
);

const frequencyData = Promise.allSettled([cedictData, characterData])
  .then(() => fetch("../../../data/SUBTLEX-CH-CHR.txt"))
  .then((res) => res.text());

const sentencesData = frequencyData
  .then(() => fetch("../../../data/sentences.txt"))
  .then((res) => res.text());

const worker = init("../pkg/zilin_worker_bg.wasm").then(
  () => new Worker(cedictData, characterData, frequencyData, sentencesData)
);

globalThis.addEventListener(
  "message",
  async (evt: MessageEvent<RequestBody>) => {
    try {
      const result = await (
        (
          await worker
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
