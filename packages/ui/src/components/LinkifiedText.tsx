import * as React from "preact";
import { useAsync } from "../hooks/useAsync.ts";
import { getWasmWorker } from "../worker.ts";

export interface LinkifiedTextProps {
  value: string;
  handleSeparators?: boolean;
}

export const LinkifiedText: React.FunctionComponent<LinkifiedTextProps> = (
  props
) => {
  const tokens = useAsync(async () => {
    return await getWasmWorker().tokenize(props.value);
  }, [props.value]);

  return (
    <>
      {tokens.value == null ? (
        <span style={{ visibility: "hidden" }}>_</span>
      ) : (
        tokens.value.map((token) => {
          if (token.hasEntries) {
            return <a href={"#" + token.value}>{token.value}</a>;
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
