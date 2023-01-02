import * as React from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { getWasmWorker } from "../worker.ts";
import { useAsync } from "../hooks/useAsync.ts";
import { TokenTextarea, Token } from "./TokenTextarea.tsx";
import { DictionaryCharacterInfo, DictionaryPane } from "./DictionaryPane.tsx";
import { ModeSwitcher, ModeValue } from "./ModeSwitcher.tsx";
import { prettifyPinyin, prettifyExplanation } from "../utils.ts";
import type { WordEntry } from "../worker.ts";

export const ModeContext = React.createContext<ModeValue>("simplified");

function getVariants(character: string, entries: WordEntry[]): string[] {
  const set = new Set(
    entries.flatMap((entry) => [entry.simplified, entry.traditional])
  );

  set.delete(character);

  return [...set].sort();
}

export const App: React.FunctionalComponent = () => {
  const wasmWorker = getWasmWorker();

  const [mode, setMode] = useState<ModeValue>("simplified");
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState<string>();

  const lookup = async (word: string, mode: ModeValue) =>
    await wasmWorker.getWord(word, mode === "simplified");

  const tokensTimeout = useRef<number | undefined>(undefined);
  const tokens = useAsync(async () => {
    clearTimeout(tokensTimeout.current);

    await new Promise((resolve) => {
      tokensTimeout.current = setTimeout(resolve, 50);
    });

    const tokens = await wasmWorker.tokenize(input);

    return tokens.map<Token>((token) => ({
      value: token.value,
      unselectable: token.value.trim() === "" || !token.hasEntries,
      pronunciation: async () => {
        const entries = [
          ...(await wasmWorker.getWord(token.value, true)),
          ...(await wasmWorker.getWord(token.value, false)),
        ];

        return [...new Set(entries.map((entry) => entry.pinyin))]
          .sort()
          .map((pinyin) => prettifyPinyin(pinyin))
          .join("/");
      },
    }));
  }, [input]);

  const frequencies = useAsync(async () => {
    return await wasmWorker.getWordFrequencies(
      tokens.continuousValue?.map((token) => token.value) ?? []
    );
  }, [tokens.continuousValue]);

  const wordInfo = useAsync(async () => {
    const dictionaryEntries =
      highlight == null
        ? { simplified: [], traditional: [] }
        : {
            simplified: await lookup(highlight, "simplified"),
            traditional: await lookup(highlight, "traditional"),
          };

    return {
      word: highlight,
      dictionaryEntries,
      homophones:
        highlight == null
          ? []
          : (await wasmWorker.getHomophones(highlight, mode === "simplified"))
              .map((entry) => ({
                value: entry[0][mode],
                highlight: entry[1],
              }))
              .filter(
                (entry, i, arr) => i === 0 || entry.value !== arr[i - 1].value
              ),
      variants: getVariants(highlight ?? "", dictionaryEntries[mode] ?? []),
    };
  }, [mode, highlight]);

  const sentences = useAsync(async () => {
    return highlight == null
      ? []
      : await wasmWorker.getSentencesIncludingWord(
          highlight,
          100,
          mode === "simplified"
        );
  }, [mode, highlight]);

  const similar = useAsync(async () => {
    return highlight == null
      ? []
      : (
          await wasmWorker.getSimilarWords(highlight, 10, mode === "simplified")
        ).map((entry) => entry[0]);
  }, [highlight, mode]);

  const characters = useAsync(
    async () =>
      await Promise.all(
        [
          ...((wordInfo.continuousValue?.dictionaryEntries[mode].length ?? 0) >
            0 && highlight != null
            ? highlight
            : ""),
        ].map<Promise<DictionaryCharacterInfo>>(async (character) => {
          const entries = await lookup(character, mode);
          const characterInfo = await wasmWorker.getCharacter(character);

          return {
            character,
            variants: getVariants(character, entries ?? []),

            meanings:
              entries?.map((entry) => ({
                pinyin: prettifyPinyin(entry.pinyin),
                explanation: prettifyExplanation(entry.english),
              })) ?? [],

            decomposition: await wasmWorker.decompose(character),

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
              await wasmWorker.getCharactersIncludingComponent(
                character,
                mode === "simplified"
              )
            )
              .map((entry) => entry.character)
              .filter((word, i, arr) => i === 0 || word !== arr[i - 1]),

            characterOf: (
              await wasmWorker.getWordsIncludingSubslice(
                character,
                200,
                mode === "simplified"
              )
            )
              .map((entry) => entry[mode])
              .filter((word, i, arr) => i === 0 || word !== arr[i - 1]),
          };
        })
      ),
    [mode, highlight, wordInfo.continuousValue]
  );

  useEffect(
    function updateTitle() {
      document.title =
        (wordInfo.continuousValue?.word?.length ?? 0) <= 0
          ? "Zilin"
          : `Zilin – ${wordInfo.continuousValue?.word}`;
    },
    [wordInfo.continuousValue]
  );

  useEffect(
    function switchMode() {
      if (
        highlight != null &&
        wordInfo.value?.dictionaryEntries[mode].length === 0
      ) {
        const otherMode = mode === "simplified" ? "traditional" : "simplified";

        if (wordInfo.value?.dictionaryEntries[otherMode].length > 0) {
          setMode(otherMode);
        }
      }
    },
    [wordInfo.value]
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
    <ModeContext.Provider value={mode}>
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
              const needHighlightChange = !wordInfo.value?.dictionaryEntries[
                mode
              ].some((entry) => entry[evt.mode] === highlight);

              if (needHighlightChange) {
                const newHighlight =
                  wordInfo.value?.dictionaryEntries[mode][0]?.[evt.mode];

                if (newHighlight != null) {
                  globalThis.location.href = "#" + newHighlight;
                }
              }

              setMode(evt.mode);
            }}
          />

          <DictionaryPane
            word={
              (wordInfo.continuousValue?.dictionaryEntries[mode].length ?? 0) >
              0
                ? wordInfo.continuousValue?.word
                : undefined
            }
            variants={wordInfo.continuousValue?.variants}
            meanings={wordInfo.continuousValue?.dictionaryEntries[mode].map(
              (entry) => ({
                pinyin: prettifyPinyin(entry.pinyin),
                explanation: prettifyExplanation(entry.english),
              })
            )}
            sentences={sentences.value}
            homophones={wordInfo.value?.homophones}
            similar={similar.value}
            characters={characters.value}
          />
        </aside>
      </div>
    </ModeContext.Provider>
  );
};
