import * as React from "preact";
import { useMemo, useState } from "preact/hooks";
import type { FunctionalComponent } from "preact";
import { Token, TokenTextarea } from "./TokenTextarea.tsx";
import { useAsync } from "../hooks/useAsync.ts";
import init, { tokenize } from "../../../tokenizer/pkg/chinese_tokenizer.js";

export const App: FunctionalComponent = () => {
  const tokenizerLoaded = useAsync(async () => {
    await init("./packages/tokenizer/pkg/chinese_tokenizer_bg.wasm");
  }, []);

  const [input, setInput] = useState("");
  
  const tokens = useMemo<Token[]>(() => {
    if (!tokenizerLoaded.fulfilled) {
      return [{ value: input }];
    } else {
      return tokenize(input);
    }
  }, [tokenizerLoaded.fulfilled, input]);

  return (
    <div class="app">
      <div class="input">
        <TokenTextarea
          value={input}
          tokens={tokens}
          onInput={(evt) => setInput(evt.currentTarget.value)}
        />
      </div>

      <div class="info"></div>
    </div>
  );
};
