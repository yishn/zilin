import * as React from "preact";

export interface DictionaryPaneProps {
  word?: string;
  variants?: string[];
}

export const DictionaryPane: React.FunctionComponent<DictionaryPaneProps> = (
  props
) => {
  return (
    <section class="dictionary-pane">
      <div class="word-info">
        <h1 class="word">{props.word}</h1>

        <ul class="variants">
          {props.variants?.map((variant) => (
            <li><a href="#">{variant}</a></li>
          ))}
        </ul>
      </div>
    </section>
  );
};
