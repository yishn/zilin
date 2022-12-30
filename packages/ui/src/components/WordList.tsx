import * as React from "preact";
import { useEffect, useState } from "preact/hooks";
import { LinkifiedText } from "./LinkifiedText.tsx";
import { ModeValue } from "./ModeSwitcher.tsx";

export interface WordListProps {
  title?: string;
  mode?: ModeValue;
  words?: string[];
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
      <LinkifiedText
        value={
          props.words
            ?.slice(0, length)
            .map((word) => word)
            .join(" ") ?? ""
        }
      />{" "}
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
