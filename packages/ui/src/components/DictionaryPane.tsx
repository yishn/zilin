import * as React from "preact";
import { useAsync } from "../hooks/useAsync.ts";
import { loadTokenizer } from "../wasm.ts";

export interface DictionaryPaneProps {
  word?: string;
  variants?: string[];
  meanings?: {
    pinyin: string;
    explanation: string;
  }[];
}

export const DictionaryPane: React.FunctionComponent<DictionaryPaneProps> = (
  props
) => {
  const explanationTokens = useAsync(async () => {
    const tokenizer = await loadTokenizer();

    return props.meanings?.map((meaning) =>
      tokenizer.tokenize(meaning.explanation)
    );
  }, props.meanings?.map((meaning) => meaning.explanation) ?? []);

  return (
    <section class="dictionary-pane">
      <div class="word-info">
        <h1 class={"word " + ((props.word?.length ?? 0) >= 4 ? "small " : "")}>
          {props.word}
        </h1>

        <ul class="variants">
          {props.variants?.map((variant) => (
            <li>
              <a href={"#" + variant}>{variant}</a>
            </li>
          ))}
        </ul>

        <ul class="meanings">
          {props.meanings?.map((entry, i) => (
            <li>
              <span class="pinyin">{entry.pinyin}</span>{" "}
              <span class="explanation">
                {explanationTokens.value?.[i] == null
                  ? entry.explanation
                  : explanationTokens.value[i].map((token) => {
                      if (token.hasEntries) {
                        return <a href={"#" + token.value}>{token.value}</a>;
                      } else if (token.value === "/" || token.value === "|") {
                        return <span class="separator">{token.value}</span>;
                      } else {
                        return token.value;
                      }
                    })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
