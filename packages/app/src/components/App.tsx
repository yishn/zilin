import * as React from "preact";
import { useMemo, useState } from "preact/hooks";
import { prettify as prettifyPinyin } from "prettify-pinyin";
// @deno-types="../../../tokenizer/pkg/chinese_tokenizer.d.ts"
import init, { tokenize } from "../../../tokenizer/pkg/chinese_tokenizer.js";
import { useAsync } from "../hooks/useAsync.ts";
import { TokenTextarea, Token } from "./TokenTextarea.tsx";
import { DictionaryPane } from "./DictionaryPane.tsx";

export const App: React.FunctionalComponent = () => {
  const tokenizerLoaded = useAsync(async () => {
    await init("./packages/tokenizer/pkg/chinese_tokenizer_bg.wasm");
  }, []);

  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState<string>();

  const tokens = useMemo(() => {
    if (tokenizerLoaded.fulfilled) {
      return tokenize(input);
    }
  }, [tokenizerLoaded.fulfilled, input]);

  const tokenTokenizerTokens = useMemo<Token[] | undefined>(
    () =>
      tokens?.map((token) => ({
        value: token.value,
        pronunciation: () =>
          [...new Set(token.entries.map((entry) => entry.pinyin))]
            .sort()
            .map((pinyin) => prettifyPinyin(pinyin.replaceAll("u:", "ü")))
            .join("/"),
        unselectable: token.value.trim() === "" || token.entries.length === 0,
      })),
    [tokens]
  );

  const dictionaryEntries = useMemo(() => {
    if (highlight != null && tokenizerLoaded.fulfilled) {
      return tokenize(highlight)[0].entries;
    }
  }, [highlight]);

  const wordVariants = useMemo(() => {
    const set = new Set(
      dictionaryEntries?.flatMap((entry) => [
        entry.simplified,
        entry.traditional,
      ])
    );

    set.delete(highlight!);

    return [...set];
  }, [dictionaryEntries, highlight]);

  return (
    <div class="app">
      <TokenTextarea
        value={input}
        loading={!tokenizerLoaded.fulfilled}
        tokens={tokenTokenizerTokens}
        highlight={highlight}
        onInput={(evt) => setInput(evt.currentTarget.value)}
        onTokenClick={(evt) => {
          setHighlight(evt.value);
        }}
      />

      <DictionaryPane word={highlight} variants={wordVariants} />
    </div>
  );
};
