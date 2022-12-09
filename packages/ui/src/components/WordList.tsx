import * as React from "preact";
import { LinkifiedText } from "./LinkifiedText.tsx";

export interface WordListProps {
  title?: string;
  words?: string[];
  length?: number;
}

export const WordList: React.FunctionComponent<WordListProps> = (props) => {
  return (props.words?.length ?? 0) <= 0 ? null : (
    <div class="word-list">
      {props.title != null && <h3>{props.title}:</h3>}{" "}
      <LinkifiedText
        value={
          props.words
            ?.slice(0, props.length)
            .map((word) => word)
            .join(" ") ?? ""
        }
      />
    </div>
  );
};
