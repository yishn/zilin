import * as React from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { prettify as pp } from "prettify-pinyin";
import { getWasmWorker } from "../worker.ts";
import { useAsync } from "../hooks/useAsync.ts";
import { TokenTextarea, Token } from "./TokenTextarea.tsx";
import { DictionaryCharacterInfo, DictionaryPane } from "./DictionaryPane.tsx";
import { ModeSwitcher, ModeValue } from "./ModeSwitcher.tsx";
import type { WordEntry } from "../worker.ts";

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
    await tokenizer.getWord(word, mode === "simplified");

  const tokensTimeout = useRef<number | undefined>(undefined);
  const tokens = useAsync(async () => {
    clearTimeout(tokensTimeout.current);

    await new Promise((resolve) => {
      tokensTimeout.current = setTimeout(resolve, 50);
    });

    const tokens = await tokenizer.tokenize(input);

    return tokens.map<Token>((token) => ({
      value: token.value,
      unselectable: token.value.trim() === "" || !token.hasEntries,
      pronunciation: async () => {
        const entries = [
          ...(await tokenizer.getWord(token.value, true)),
          ...(await tokenizer.getWord(token.value, false)),
        ];

        return [...new Set(entries.map((entry) => entry.pinyin))]
          .sort()
          .map((pinyin) => prettifyPinyin(pinyin))
          .join("/");
      },
    }));
  }, [input]);

  const frequencies = useAsync(async () => {
    return await tokenizer.getWordFrequencies(
      tokens.continuousValue?.map((token) => token.value) ?? []
    );
  }, [tokens.continuousValue]);

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

  const sentences = useAsync(async () => {
    return highlight == null
      ? []
      : await tokenizer.getSentencesIncludingWord(
          highlight,
          10,
          mode === "simplified"
        );
  }, [mode, highlight]);

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
        dictionaryEntries.continuousValue?.[mode] ?? []
      ),
    [dictionaryEntries.continuousValue]
  );

  const characters = useAsync(
    async () =>
      await Promise.all(
        [
          ...((dictionaryEntries.continuousValue?.[mode].length ?? 0) > 0 &&
          highlight != null
            ? highlight
            : ""),
        ].map<Promise<DictionaryCharacterInfo>>(async (character) => {
          const entries = await lookup(character, mode);
          const characterInfo = await tokenizer.getCharacter(character);

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
                : characterInfo.etymology.semantic == null &&
                  characterInfo.etymology.phonetic == null
                ? undefined
                : [
                    characterInfo.etymology.semantic == null
                      ? null
                      : `${characterInfo.etymology.semantic} provides the meaning`,
                    characterInfo.etymology.phonetic == null
                      ? null
                      : `${characterInfo.etymology.phonetic} provides the pronunciation`,
                  ]
                    .filter((line) => line != null)
                    .join(", while ") + ".",

            componentOf: (
              await tokenizer.getCharactersIncludingComponent(
                character,
                mode === "simplified"
              )
            )
              .map((entry) => entry.character)
              .filter((word, i, arr) => i === 0 || word !== arr[i - 1]),

            characterOf: (
              await tokenizer.getWordsIncludingSubslice(
                character,
                100,
                mode === "simplified"
              )
            )
              .map((entry) => entry[mode])
              .filter((word, i, arr) => i === 0 || word !== arr[i - 1]),
          };
        })
      ),
    [mode, highlight, dictionaryEntries.continuousValue]
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
      if (highlight != null && dictionaryEntries.value?.[mode].length === 0) {
        const otherMode = mode === "simplified" ? "traditional" : "simplified";

        if (dictionaryEntries.value[otherMode].length > 0) {
          setMode(otherMode);
        }
      }
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
        loading={tokens.continuousValue == null}
        tokens={tokens.continuousValue?.map((token, i) => {
          token.frequency = frequencies.value?.[i];
          return token;
        })}
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
            (dictionaryEntries.continuousValue?.[mode].length ?? 0) > 0
              ? highlight
              : undefined
          }
          variants={wordVariants}
          meanings={dictionaryEntries.continuousValue?.[mode].map((entry) => ({
            pinyin: prettifyPinyin(entry.pinyin),
            explanation: prettifyExplanation(entry.english),
          }))}
          sentences={sentences.value}
          characters={characters.value}
        />
      </aside>
    </div>
  );
};
