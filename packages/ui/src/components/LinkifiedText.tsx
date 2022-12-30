import * as React from "preact";
import { useAsync } from "../hooks/useAsync.ts";
import { getWasmWorker } from "../worker.ts";
import { DictionaryPopupLink } from "./DictionaryPopup.tsx";

export interface LinkifiedTextProps {
  value: string;
  handleSeparators?: boolean;
}

export const LinkifiedText: React.FunctionComponent<LinkifiedTextProps> = (
  props
) => {
  const wasmWorker = getWasmWorker();

  const tokens = useAsync(async () => {
    return await wasmWorker.tokenize(props.value);
  }, [props.value]);

  return (
    <>
      {tokens.value == null ? (
        <span style={{ visibility: "hidden" }}>{props.value}</span>
      ) : (
        tokens.value.map((token) => {
          if (token.hasEntries) {
            return <DictionaryPopupLink word={token.value} />;
          } else if (
            props.handleSeparators &&
            (token.value === "/" || token.value === "|")
          ) {
            return <span class="separator">{token.value}</span>;
          } else {
            return token.value;
          }
        })
      )}
    </>
  );
};
