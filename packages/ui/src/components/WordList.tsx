import * as React from "preact";
import { useEffect, useState } from "preact/hooks";
import { DictionaryPopupLink } from "./DictionaryPopup.tsx";
import { ModeValue } from "./ModeSwitcher.tsx";

export interface WordListProps {
  title?: string;
  mode?: ModeValue;
  words?: (string | { value: string; highlight: boolean })[];
  length?: number;
}

export const WordList: React.FunctionComponent<WordListProps> = (props) => {
  const [length, setLength] = useState(props.length ?? Infinity);

  useEffect(
    function updateLength() {
      setLength(props.length ?? Infinity);
    },
    [props.length, props.words]
  );

  return (props.words?.length ?? 0) <= 0 ? null : (
    <div class="word-list">
      {props.title != null && <h3>{props.title}:</h3>}{" "}
      {props.words?.slice(0, length).map((entry) =>
        typeof entry === "string" ? (
          <DictionaryPopupLink word={entry} />
        ) : !entry.highlight ? (
          <DictionaryPopupLink word={entry.value} />
        ) : (
          <em>
            <DictionaryPopupLink word={entry.value} />
          </em>
        )
      )}{" "}
      {length < (props.words?.length ?? 0) && (
        <a
          class="more"
          href="#"
          onClick={(evt) => {
            evt.preventDefault();

            if (props.length != null) {
              setLength((length) => length + props.length!);
            }
          }}
        >
          more
        </a>
      )}
    </div>
  );
};
