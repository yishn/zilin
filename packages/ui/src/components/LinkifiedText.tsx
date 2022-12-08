import * as React from "preact";
import { useAsync } from "../hooks/useAsync.ts";
import { loadTokenizer } from "../wasm.ts";

export interface LinkifiedTextProps {
  value: string;
  handleSeparators?: boolean;
}

export const LinkifiedText: React.FunctionComponent<LinkifiedTextProps> = (
  props
) => {
  const tokens = useAsync(async () => {
    const tokenizer = await loadTokenizer();

    return tokenizer.tokenize(props.value);
  }, [props.value]);

  return (
    <>
      {tokens.value == null
        ? props.value
        : tokens.value.map((token) => {
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
          })}
    </>
  );
};
