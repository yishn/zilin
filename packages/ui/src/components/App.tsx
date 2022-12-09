import * as React from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { prettify as pp } from "prettify-pinyin";
import { loadTokenizer } from "../tokenizer.ts";
import { useAsync } from "../hooks/useAsync.ts";
import { TokenTextarea, Token } from "./TokenTextarea.tsx";
import { DictionaryPane } from "./DictionaryPane.tsx";
import { ModeSwitcher, ModeValue } from "./ModeSwitcher.tsx";
import type { WordEntry } from "../../../tokenizer/pkg/chinese_tokenizer.d.ts";

function prettifyPinyin(pinyin: string): string {
  return pp(pinyin.replaceAll("u:", "ü")).replace(/\s+/g, "");
}

function prettifyExplanation(input: string): string {
  return input
    .replaceAll("/", " / ")
    .replaceAll("|", " | ")
    .replaceAll(",", ", ")
    .replace(/\[([^\]]*)\]/g, (_, pinyin) => ` [${prettifyPinyin(pinyin)}]`)
    .replaceAll(":", ": ");
}

export const App: React.FunctionalComponent = () => {
  const tokenizer = loadTokenizer();

  const [mode, setMode] = useState<ModeValue>("simplified");
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState<string>();

  const lookup = async (word: string, mode: ModeValue) =>
    mode === "simplified"
      ? await tokenizer.lookupSimplified(word)
      : await tokenizer.lookupTraditional(word);

  const tokens = useAsync(
    async () =>
      (await tokenizer.tokenize(input)).map<Token>((token) => ({
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
      })),
    [input]
  );

  const dictionaryEntries = useAsync(
    async () =>
      highlight == null ? [] : (await lookup(highlight, mode)) ?? [],
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
        dictionaryEntries.value ?? dictionaryEntries.previousValue ?? []
      ),
    [dictionaryEntries.value ?? dictionaryEntries.previousValue]
  );

  const characters = useAsync(
    async () =>
      await Promise.all(
        [
          ...((dictionaryEntries.value?.length ?? 0) > 0 && highlight != null
            ? highlight
            : ""),
        ].map(async (character) => {
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
          };
        })
      ),
    [highlight, dictionaryEntries.value]
  );

  useEffect(
    function switchMode() {
      (async () => {
        if (highlight != null && dictionaryEntries.value?.length === 0) {
          const otherMode =
            mode === "simplified" ? "traditional" : "simplified";

          if ((await lookup(highlight, otherMode)!).length > 0) {
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
        loading={!tokens.fulfilled}
        tokens={tokens.value}
        highlight={highlight}
        onInput={(evt) => setInput(evt.currentTarget.value)}
      />

      <aside>
        <ModeSwitcher
          mode={mode}
          onChange={(evt) => {
            const needHighlightChange = !dictionaryEntries.value?.some(
              (entry) => entry[evt.mode] === highlight
            );

            if (needHighlightChange) {
              const newHighlight = dictionaryEntries.value?.[0]?.[evt.mode];
              globalThis.location.href = "#" + newHighlight;
            }

            setMode(evt.mode);
          }}
        />

        <DictionaryPane
          word={
            ((dictionaryEntries.value ?? dictionaryEntries.previousValue)
              ?.length ?? 0) > 0
              ? highlight
              : undefined
          }
          variants={wordVariants}
          meanings={(
            dictionaryEntries.value ?? dictionaryEntries.previousValue
          )?.map((entry) => ({
            pinyin: prettifyPinyin(entry.pinyin),
            explanation: prettifyExplanation(entry.english),
          }))}
          characters={characters.value ?? characters.previousValue}
        />
      </aside>
    </div>
  );
};
