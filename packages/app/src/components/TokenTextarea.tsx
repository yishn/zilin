import * as React from "preact";
import type { JSX } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

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

  const [tokenRects, setTokenRects] = useState<
    {
      left: number;
      top: number;
      width: number;
      height: number;
    }[][]
  >();
  const [bottomPosition, setBottomPosition] = useState<number>();

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

  useEffect(
    function updateTokenRects() {
      const container = containerRef.current;
      const tokensContainer = tokensContainerRef.current;

      if (container == null || tokensContainer == null) return;

      setTokenRects(
        [...tokensContainer.querySelectorAll<HTMLElement>(".token")].map((el) =>
          [...el.getClientRects()].map((rect) => ({
            left: rect.left + tokensContainer.scrollLeft - container.offsetLeft,
            top: rect.top + tokensContainer.scrollTop - container.offsetTop,
            width: Math.max(rect.width, 1),
            height: rect.height,
          }))
        )
      );

      setBottomPosition(
        tokensContainer.querySelector<HTMLElement>(".bottom")?.offsetTop
      );
    },
    [props.tokens]
  );

  const tokens = props.loading
    ? [{ value: props.value } as Token]
    : props.tokens ?? [];

  const handleScroll = useCallback((evt: JSX.TargetedUIEvent<HTMLElement>) => {
    setScrollPosition([
      evt.currentTarget.scrollLeft,
      evt.currentTarget.scrollTop,
    ]);
  }, []);

  return (
    <div
      ref={containerRef}
      class={"token-textarea " + (props.loading ? "loading " : "")}
    >
      <div ref={tokensContainerRef} class="tokens" onScroll={handleScroll}>
        {tokens?.map((token, i) => (
          <span class="token">
            {[...token.value].map((char) =>
              i === tokens!.length - 1 && char === "\n" ? "\n " : char
            )}
          </span>
        ))}

        <div class="bottom"></div>
      </div>

      <textarea
        value={props.value}
        onInput={props.onInput}
        onScroll={handleScroll}
      />

      <div class="overlay" onScroll={handleScroll}>
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
                "word " + (props.highlight === token.value ? "highlight " : "")
              }
              style={{
                position: "absolute",
                ...wordRect,
              }}
            >
              {rects.map((rect) => (
                <span
                  class={
                    "character " +
                    (props.highlight === token.value ? "highlight " : "")
                  }
                  style={{
                    position: "absolute",
                    left: rect.left - wordRect.left,
                    top: rect.top - wordRect.top,
                    width: rect.width,
                    height: rect.height,
                  }}
                >
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
            </div>
          );
        })}

        <div
          class="padding"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: bottomPosition,
            height: "1.2rem",
          }}
        ></div>
      </div>
    </div>
  );
};
