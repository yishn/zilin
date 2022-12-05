import * as React from "preact";
import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

export interface Token {
  value: string;
  pronunciation?: () => string;
  unselectable?: boolean;
}

export interface TokenTextareaProps {
  value?: string;
  loading?: boolean;
  tokens?: Token[];
  highlight?: string;
  onInput?: JSX.EventHandler<JSX.TargetedEvent<HTMLTextAreaElement, Event>>;
  onTokenClick?: (evt: { value: string; index: number }) => void;
}

export const TokenTextarea: React.FunctionComponent<TokenTextareaProps> = (
  props
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokensContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState<[number, number]>([
    0, 0,
  ]);

  useEffect(
    function updateScrollTop() {
      if (containerRef.current != null) {
        for (const child of [...containerRef.current.children]) {
          if (child.scrollTop != scrollPosition[1]) {
            child.scrollTop = scrollPosition[1];
          }

          if (child.scrollLeft != scrollPosition[0]) {
            child.scrollLeft = scrollPosition[0];
          }
        }
      }
    },
    [scrollPosition]
  );

  const tokens = props.loading
    ? [{ value: props.value } as Token]
    : props.tokens ?? [];

  return (
    <div
      ref={containerRef}
      class={"token-textarea " + (props.loading ? "loading " : "")}
    >
      <textarea
        value={props.value}
        onInput={props.onInput}
        onScroll={(evt) => {
          setScrollPosition([
            evt.currentTarget.scrollLeft,
            evt.currentTarget.scrollTop,
          ]);
        }}
      />

      <div
        ref={tokensContainerRef}
        class="tokens"
        onScroll={(evt) => {
          setScrollPosition([
            evt.currentTarget.scrollLeft,
            evt.currentTarget.scrollTop,
          ]);
        }}
      >
        {tokens?.map((token, i) => (
          <span
            class={
              "token " + (props.highlight === token.value ? "highlight " : "")
            }
          >
            {[...token.value].map((char) => (
              <span
                class={
                  "character " +
                  (props.highlight === char || props.highlight === token.value
                    ? "highlight "
                    : "")
                }
              >
                {i === tokens!.length - 1 && char === "\n" ? "\n " : char}

                {!token.unselectable && (
                  <a
                    href="#"
                    onClick={(evt) => {
                      evt.preventDefault();

                      props.onTokenClick?.({
                        value: token.value,
                        index: i,
                      });
                    }}
                  />
                )}
              </span>
            ))}

            {props.highlight === token.value && (
              <span class="pronunciation">{token.pronunciation?.()}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};
