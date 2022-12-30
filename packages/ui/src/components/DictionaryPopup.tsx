import * as React from "preact";
import { useContext, useEffect, useMemo, useRef } from "preact/hooks";
import { useResizeObserver } from "../hooks/useResizeObserver.ts";
import { prettifyExplanation, prettifyPinyin } from "../utils.ts";
import { getWasmWorker } from "../worker.ts";
import { ModeContext } from "./App.tsx";

export interface DictionaryPopupLinkProps {
  word: string;
  text?: string;
}

export const DictionaryPopupLink: React.FunctionComponent<
  DictionaryPopupLinkProps
> = (props) => {
  const mode = useContext(ModeContext);
  const hoverTimeout = useRef<number>();
  const closeDictionayPopup = useRef<() => void>();

  useEffect(
    () => () => {
      clearTimeout(hoverTimeout.current);
      closeDictionayPopup.current?.();
    },
    [props.word]
  );

  return (
    <a
      href={"#" + props.word}
      onMouseLeave={() => {
        clearTimeout(hoverTimeout.current);

        closeDictionayPopup.current?.();
        closeDictionayPopup.current = undefined;
      }}
      onMouseMove={(evt) => {
        if (closeDictionayPopup.current != null) return;

        clearTimeout(hoverTimeout.current);

        hoverTimeout.current = setTimeout(async () => {
          const wasmWorker = getWasmWorker();
          const entries = await wasmWorker
            .getWord(props.word, mode === "simplified")
            .then((entries) =>
              entries.length > 0
                ? entries
                : wasmWorker.getWord(props.word, mode !== "simplified")
            );
          if (entries.length === 0) return;

          const meanings = entries
            .flatMap((entry) => entry.english.split("/"))
            .map((meaning) => prettifyExplanation(meaning))
            .filter(
              (meaning) =>
                !meaning.includes("surname ") &&
                !meaning.includes("CL:") &&
                !meaning.includes("variant of")
            );

          closeDictionayPopup.current = showDictionaryPopup(
            {
              pronunciation: [...new Set(entries.map((entry) => entry.pinyin))]
                .sort()
                .map((pinyin) => prettifyPinyin(pinyin))
                .join("/"),
              meanings,
              rows: 5,
            },
            evt
          );
        }, 500);
      }}
    >
      {props.text ?? props.word}
    </a>
  );
};

export interface DictionaryPopupProps {
  position?: [x: number, y: number];
  pronunciation?: string;
  meanings?: string[];
  rows?: number;
}

export const DictionaryPopup: React.FunctionComponent<DictionaryPopupProps> = (
  props
) => {
  const containerRef = useRef<HTMLElement>(null);

  const overlaySize = useResizeObserver(document.getElementById("popup")!);
  const containerSize = useResizeObserver(containerRef.current);

  const orientation = useMemo(() => {
    const style =
      containerRef.current == null
        ? null
        : window.getComputedStyle(containerRef.current);

    return containerSize == null || overlaySize == null
      ? null
      : (props.position?.[1] ?? 0) +
          containerSize.height +
          parseInt(style?.marginTop ?? "0", 10) +
          parseInt(style?.marginBottom ?? "0", 10) >
        overlaySize.height
      ? "top"
      : "bottom";
  }, [containerRef.current, containerSize, overlaySize, props.position]);

  return (
    <aside
      ref={containerRef}
      class="dictionary-popup"
      style={{
        left:
          containerSize == null
            ? 0
            : Math.max(
                0,
                Math.min(
                  (props.position?.[0] ?? 0) - (containerSize?.width ?? 0) / 2,
                  (overlaySize?.width ?? 0) - (containerSize?.width ?? 0)
                )
              ),
        [orientation === "top" ? "bottom" : "top"]:
          containerSize == null
            ? 0
            : orientation === "top"
            ? (overlaySize?.height ?? 0) - (props.position?.[1] ?? 0)
            : props.position?.[1],
        opacity: containerSize == null ? 0 : 1,
      }}
    >
      {props.pronunciation == null ? null : (
        <p class="pronunciation">{props.pronunciation}</p>
      )}

      {(props.meanings?.length ?? 0) === 0 ? null : (
        <ul class="meanings">
          {props.meanings?.slice(0, props.rows).map((meaning) => (
            <li>{meaning}</li>
          ))}
          {props.rows != null && (props.meanings?.length ?? 0) > props.rows ? (
            <li class="more">…</li>
          ) : null}
        </ul>
      )}
    </aside>
  );
};

export function showDictionaryPopup(
  props: DictionaryPopupProps,
  evt?: MouseEvent
): () => void {
  const popupContainerElement = document.getElementById("popup")!;

  if (props.position == null && evt != null) {
    props.position = [evt.clientX, evt.clientY];
  }

  React.render(<DictionaryPopup {...props} />, popupContainerElement);

  return () => {
    React.render(null, popupContainerElement);
  };
}
