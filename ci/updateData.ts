import { Foras, gunzip } from "https://deno.land/x/foras@2.0.2/deno/mod.ts";

await Foras.initBundledOnce();

console.log("Downloading CEDICT...");

const response = await fetch(
  "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
);

if (!response.ok) {
  throw new Error("Downloading CEDICT failed.");
}

const data = gunzip(new Uint8Array(await response.arrayBuffer()));

await Deno.writeFile(
  new URL("../data/cedict_1_0_ts_utf-8_mdbg.txt", import.meta.url),
  data
);
