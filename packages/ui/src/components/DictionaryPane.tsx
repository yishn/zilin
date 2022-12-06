import * as React from "preact";
import { useAsync } from "../hooks/useAsync.ts";
import { loadTokenizer } from "../wasm.ts";

export interface DictionaryMeaning {
  pinyin: string;
  explanation: string;
}

interface MeaningsListProps {
  meanings?: DictionaryMeaning[];
}

const MeaningsList: React.FunctionComponent<MeaningsListProps> = (props) => {
  const explanationTokens = useAsync(async () => {
    const tokenizer = await loadTokenizer();

    return props.meanings?.map((meaning) =>
      tokenizer.tokenize(meaning.explanation)
    );
  }, props.meanings?.map((meaning) => meaning.explanation) ?? []);

  return (
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
  );
};

export interface DictionaryPaneProps {
  word?: string;
  variants?: string[];
  meanings?: DictionaryMeaning[];
  characters?: {
    character: string;
    meanings: DictionaryMeaning[];
  }[];
}

export const DictionaryPane: React.FunctionComponent<DictionaryPaneProps> = (
  props
) => {
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

        <MeaningsList meanings={props.meanings} />
      </div>

      <ol class="character-info">
        {props.characters?.map((info) => (
          <li>
            <h1 class="word small">{info.character}</h1>

            <MeaningsList meanings={info.meanings} />
          </li>
        ))}
      </ol>
    </section>
  );
};
