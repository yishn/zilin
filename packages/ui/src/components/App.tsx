import * as React from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { prettify as pp } from "prettify-pinyin";
import { getWasmWorker } from "../worker.ts";
import { useAsync } from "../hooks/useAsync.ts";
import { TokenTextarea, Token } from "./TokenTextarea.tsx";
import { DictionaryCharacterInfo, DictionaryPane } from "./DictionaryPane.tsx";
import { ModeSwitcher, ModeValue } from "./ModeSwitcher.tsx";
import type { WordEntry } from "../../../tokenizer/pkg/chinese_tokenizer.d.ts";

function prettifyPinyin(pinyin: string): string {
  return pp(pinyin.replaceAll("u:", "ü")).replace(/\s+/g, "");
}

function prettifyExplanation(input: string): string {
  return (
    input
      .replace(/\[([^\]]*)\]/g, (_, pinyin) => ` [${prettifyPinyin(pinyin)}]`)
      // Add spaces around delimiters
      .replaceAll("/", " / ")
      .replaceAll("|", " | ")
      .replaceAll(",", ", ")
      .replaceAll(":", ": ")
      // Use correct typography
      .replace(/\.{3}/g, "…")
      .replace(/(\S)('|´)/g, "$1’")
      .replace(/(\S)"/g, "$1”")
      .replace(/('|`)(\S)/g, "‘$2")
      .replace(/"(\S)/g, "“$1")
      .replace(/(\s)-(\s)/g, "$1–$2")
  );
}

export const App: React.FunctionalComponent = () => {
  const tokenizer = getWasmWorker();

  const [mode, setMode] = useState<ModeValue>("simplified");
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState<string>();

  const lookup = async (word: string, mode: ModeValue) =>
    mode === "simplified"
      ? await tokenizer.lookupSimplified(word)
      : await tokenizer.lookupTraditional(word);

  const tokensTimeout = useRef<number | undefined>(undefined);
  const tokens = useAsync(async () => {
    clearTimeout(tokensTimeout.current);

    await new Promise((resolve) => {
      tokensTimeout.current = setTimeout(resolve, 50);
    });

    const tokens = await tokenizer.tokenize(input);

    return tokens.map<Token>((token) => ({
      value: token.value,
      pronunciation: async () => {
        const entries = [
          ...(await tokenizer.lookupSimplified(token.value)),
          ...(await tokenizer.lookupTraditional(token.value)),
        ];

        return [...new Set(entries.map((entry) => entry.pinyin))]
          .sort()
          .map((pinyin) => prettifyPinyin(pinyin))
          .join("/");
      },
      unselectable: token.value.trim() === "" || !token.hasEntries,
    }));
  }, [input]);

  const dictionaryEntries = useAsync(
    async () =>
      highlight == null
        ? { simplified: [], traditional: [] }
        : {
            simplified: await lookup(highlight, "simplified"),
            traditional: await lookup(highlight, "traditional"),
          },
    [mode, highlight]
  );

  function getVariants(character: string, entries: WordEntry[]): string[] {
    const set = new Set(
      entries.flatMap((entry) => [entry.simplified, entry.traditional])
    );

    set.delete(character);

    return [...set].sort();
  }

  const wordVariants = useMemo(
    () =>
      getVariants(
        highlight ?? "",
        (dictionaryEntries.value ?? dictionaryEntries.previousValue)?.[mode] ??
          []
      ),
    [dictionaryEntries.value ?? dictionaryEntries.previousValue]
  );

  const characters = useAsync(
    async () =>
      await Promise.all(
        [
          ...(((dictionaryEntries.value ?? dictionaryEntries.previousValue)?.[
            mode
          ].length ?? 0) > 0 && highlight != null
            ? highlight
            : ""),
        ].map<Promise<DictionaryCharacterInfo>>(async (character) => {
          const entries = await lookup(character, mode);
          const characterInfo = await tokenizer.lookupCharacter(character);

          return {
            character,
            variants: getVariants(character, entries ?? []),
            meanings:
              entries?.map((entry) => ({
                pinyin: prettifyPinyin(entry.pinyin),
                explanation: prettifyExplanation(entry.english),
              })) ?? [],
            decomposition: await tokenizer.decompose(character),
            etymology:
              characterInfo?.etymology?.type !== "pictophonetic"
                ? characterInfo?.etymology?.hint
                : undefined,
            componentOf: (
              await (mode === "simplified"
                ? tokenizer.lookupSimplifiedCharactersIncludingComponent
                : tokenizer.lookupTraditionalCharactersIncludingComponent)(
                character
              )
            )
              .map((entry) => entry.character)
              .filter((word, i, arr) => i === 0 || word !== arr[i - 1]),
            characterOf: (
              await (mode === "simplified"
                ? tokenizer.lookupSimplifiedIncludingSubslice
                : tokenizer.lookupTraditionalIncludingSubslice)(character, 100)
            )
              .map((entry) => entry[mode])
              .filter((word, i, arr) => i === 0 || word !== arr[i - 1]),
          };
        })
      ),
    [
      mode,
      highlight,
      dictionaryEntries.value ?? dictionaryEntries.previousValue,
    ]
  );

  useEffect(
    function updateTitle() {
      document.title =
        (highlight?.length ?? 0) <= 0 ? "Zilin" : `Zilin – ${highlight}`;
    },
    [highlight]
  );

  useEffect(
    function switchMode() {
      (async () => {
        if (highlight != null && dictionaryEntries.value?.[mode].length === 0) {
          const otherMode =
            mode === "simplified" ? "traditional" : "simplified";

          if (dictionaryEntries.value[otherMode].length > 0) {
            setMode(otherMode);
          }
        }
      })();
    },
    [dictionaryEntries.value]
  );

  useEffect(function handleHistory() {
    const handlePopState = (evt?: PopStateEvent) => {
      evt?.preventDefault();

      const word = decodeURIComponent(document.location.hash.slice(1));

      if (word.trim() !== "") {
        setHighlight(word);
      }
    };

    handlePopState();

    globalThis.addEventListener("popstate", handlePopState);

    return () => globalThis.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div class="app">
      <TokenTextarea
        value={input}
        loading={(tokens.value ?? tokens.previousValue) == null}
        tokens={tokens.value ?? tokens.previousValue}
        highlight={highlight}
        onInput={(evt) => setInput(evt.currentTarget.value)}
      />

      <aside>
        <ModeSwitcher
          mode={mode}
          onChange={(evt) => {
            const needHighlightChange = !dictionaryEntries.value?.[mode].some(
              (entry) => entry[evt.mode] === highlight
            );

            if (needHighlightChange) {
              const newHighlight =
                dictionaryEntries.value?.[mode][0]?.[evt.mode];

              if (newHighlight != null) {
                globalThis.location.href = "#" + newHighlight;
              }
            }

            setMode(evt.mode);
          }}
        />

        <DictionaryPane
          word={
            ((dictionaryEntries.value ?? dictionaryEntries.previousValue)?.[
              mode
            ].length ?? 0) > 0
              ? highlight
              : undefined
          }
          variants={wordVariants}
          meanings={(dictionaryEntries.value ??
            dictionaryEntries.previousValue)?.[mode].map((entry) => ({
            pinyin: prettifyPinyin(entry.pinyin),
            explanation: prettifyExplanation(entry.english),
          }))}
          characters={characters.value ?? characters.previousValue}
        />
      </aside>
    </div>
  );
};
