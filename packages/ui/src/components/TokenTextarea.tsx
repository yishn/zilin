import * as React from "preact";
import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { useResizeObserver } from "../hooks/useResizeObserver.ts";

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
}

export const TokenTextarea: React.FunctionComponent<TokenTextareaProps> = (
  props
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokensContainerRef = useRef<HTMLDivElement>(null);
  const contentSize = useResizeObserver(tokensContainerRef);

  const [tokenRects, setTokenRects] = useState<
    {
      left: number;
      top: number;
      width: number;
      height: number;
    }[][]
  >();

  useEffect(
    function updateTokenRects() {
      const container = containerRef.current;
      const tokensContainer = tokensContainerRef.current;

      if (contentSize == null || container == null || tokensContainer == null)
        return;

      setTokenRects(
        [...tokensContainer.querySelectorAll<HTMLElement>(".token")].map((el) =>
          [...el.getClientRects()].map((rect) => ({
            left: rect.left + container.scrollLeft - container.offsetLeft,
            top: rect.top + container.scrollTop - container.offsetTop,
            width: Math.max(rect.width, 1),
            height: rect.height,
          }))
        )
      );
    },
    [contentSize, props.tokens]
  );

  const tokens = props.loading
    ? [{ value: props.value } as Token]
    : props.tokens ?? [];

  return (
    <div
      ref={containerRef}
      class={"token-textarea " + (props.loading ? "loading " : "")}
    >
      <div ref={tokensContainerRef} class="tokens">
        {tokens?.map((token, i) => (
          <span class="token">
            {i === tokens.length - 1 &&
            token.value[token.value.length - 1] === "\n"
              ? token.value + " "
              : token.value}
          </span>
        ))}
      </div>

      {contentSize != null && (
        <textarea
          style={{ ...contentSize }}
          autofocus
          value={props.value}
          onInput={props.onInput}
        />
      )}

      {contentSize != null && (
        <div class="overlay" style={{ ...contentSize }}>
          {tokenRects?.map((rects, i) => {
            const token = tokens[i];
            if (token == null) return;

            const wordRect = {
              left: rects[0]?.left,
              top: rects[0]?.top,
              height: rects[0]?.height,
              width: rects
                .filter((rect) => rect.top === rects[0]?.top)
                .map((rect) => rect.width)
                .reduce((sum, x) => sum + x, 0),
            };

            return (
              <div
                class={
                  "word " +
                  (props.highlight === token.value ? "highlight " : "")
                }
                style={{
                  position: "absolute",
                  ...wordRect,
                }}
              >
                {rects.map((rect) => (
                  <span
                    class="box"
                    style={{
                      position: "absolute",
                      left: rect.left - wordRect.left,
                      top: rect.top - wordRect.top,
                      width: rect.width,
                      height: rect.height,
                    }}
                  >
                    {!token.unselectable && <a href={"#" + token.value} />}
                  </span>
                ))}

                {props.highlight === token.value && (
                  <span class="pronunciation">{token.pronunciation?.()}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
