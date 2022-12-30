import { Foras, gunzip } from "https://deno.land/x/foras@2.0.2/deno/mod.ts";

await Foras.initBundledOnce();

async function downloadCedict() {
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
}

async function downloadCharacterDictionary() {
  console.log("Downloading dictionary...");

  const response = await fetch(
    "https://github.com/skishore/makemeahanzi/raw/master/dictionary.txt"
  );

  if (!response.ok) {
    throw new Error("Downloading character dictionary failed.");
  }

  const data = new Uint8Array(await response.arrayBuffer());

  await Deno.writeFile(
    new URL("../data/dictionary.txt", import.meta.url),
    data
  );
}

await downloadCedict();
await downloadCharacterDictionary();
