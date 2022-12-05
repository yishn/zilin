import * as React from "preact";

export interface DictionaryPaneProps {
  word?: string;
  variants?: string[];
  meanings?: { pinyin: string; explanation: string }[];
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

        <ul class="meanings">
          {props.meanings?.map((entry) => (
            <li>
              <span class="pinyin">{entry.pinyin}</span>{" "}
              <span class="explanation">{entry.explanation}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
