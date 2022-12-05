import * as React from "preact";
import { useMemo, useState } from "preact/hooks";
import { prettify as prettifyPinyin } from "prettify-pinyin";
import { TokenTextarea } from "./TokenTextarea.tsx";
import { useAsync } from "../hooks/useAsync.ts";
// @deno-types="../../../tokenizer/pkg/chinese_tokenizer.d.ts"
import init, {
  tokenize,
  Token,
} from "../../../tokenizer/pkg/chinese_tokenizer.js";

export const App: React.FunctionalComponent = () => {
  const tokenizerLoaded = useAsync(async () => {
    await init("./packages/tokenizer/pkg/chinese_tokenizer_bg.wasm");
  }, []);

  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState<string>();

  const tokens = useMemo<Token[] | undefined>(() => {
    if (tokenizerLoaded.fulfilled) {
      return tokenize(input);
    }
  }, [tokenizerLoaded.fulfilled, input]);

  return (
    <div class="app">
      <TokenTextarea
        value={input}
        loading={!tokenizerLoaded.fulfilled}
        tokens={useMemo(
          () =>
            tokens?.map((token) => ({
              value: token.value,
              pronunciation: () =>
                [...new Set(token.entries.map((entry) => entry.pinyin))]
                  .sort()
                  .map((pinyin) => prettifyPinyin(pinyin.replaceAll("u:", "ü")))
                  .join("/"),
              unselectable:
                token.value.trim() === "" || token.entries.length === 0,
            })),
          [tokens]
        )}
        highlight={highlight}
        onInput={(evt) => setInput(evt.currentTarget.value)}
        onTokenClick={(evt) => {
          setHighlight(evt.value);
        }}
      />

      <div class="info">
        <h1>{highlight}</h1>
      </div>
    </div>
  );
};
