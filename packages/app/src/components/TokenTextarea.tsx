import * as React from "preact";
import type { FunctionalComponent, JSX } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

export interface Token {
  value: string;
  unselectable?: boolean;
}

export interface TokenTextareaProps {
  value?: string;
  tokens?: Token[];
  loading?: boolean;
  onInput?: JSX.EventHandler<JSX.TargetedEvent<HTMLTextAreaElement, Event>>;
}

export const TokenTextarea: FunctionalComponent<TokenTextareaProps> = (
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

  return (
    <div ref={containerRef} class="token-textarea">
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

      <div ref={tokensContainerRef} class="tokens">
        {props.tokens?.map((token, i) => (
          <span class="token">
            {[...token.value].map((char) => (
              <span class="character">
                {i === props.tokens!.length - 1 && char === "\n" ? "\n " : char}

                {!token.unselectable && token.value.trim() !== "" && (
                  <a href="#" />
                )}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
};
