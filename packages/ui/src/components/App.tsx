import * as React from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { prettify as pp } from "prettify-pinyin";
import { loadTokenizer } from "../wasm.ts";
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
    .replaceAll(":", ": ")
    .replace(/\[([^\]]*)\]/g, (_, pinyin) => ` [${prettifyPinyin(pinyin)}]`);
}

export const App: React.FunctionalComponent = () => {
  const tokenizer = useAsync(async () => {
    return await loadTokenizer();
  }, []);

  const [mode, setMode] = useState<ModeValue>("simplified");
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState<string>();

  const tokens = useMemo(
    () => tokenizer.value?.tokenize(input),
    [tokenizer.value, input]
  );

  const lookup = (word: string, mode: ModeValue) =>
    mode === "simplified"
      ? tokenizer.value?.lookupSimplified(word)
      : tokenizer.value?.lookupTraditional(word);

  const tokenTokenizerTokens = useMemo(
    () =>
      tokens?.map<Token>((token) => ({
        value: token.value,
        pronunciation: () => {
          const entries = [
            ...(tokenizer.value?.lookupSimplified(token.value) ?? []),
            ...(tokenizer.value?.lookupTraditional(token.value) ?? []),
          ];

          return [...new Set(entries.map((entry) => entry.pinyin))]
            .sort()
            .map((pinyin) => prettifyPinyin(pinyin))
            .join("/");
        },
        unselectable: token.value.trim() === "" || !token.hasEntries,
      })),
    [tokens]
  );

  const dictionaryEntries = useMemo(() => {
    if (highlight != null && tokenizer.fulfilled) {
      return lookup(highlight, mode) ?? [];
    }

    return [];
  }, [mode, tokenizer.fulfilled, highlight]);

  function getVariants(character: string, entries: WordEntry[]): string[] {
    const set = new Set(
      entries.flatMap((entry) => [entry.simplified, entry.traditional])
    );

    set.delete(character);

    return [...set].sort();
  }

  const wordVariants = useMemo(
    () => getVariants(highlight ?? "", dictionaryEntries),
    [dictionaryEntries, highlight]
  );

  useEffect(
    function switchMode() {
      if (
        tokenizer.value != null &&
        highlight != null &&
        dictionaryEntries.length === 0
      ) {
        const otherMode = mode === "simplified" ? "traditional" : "simplified";

        if (lookup(highlight, otherMode)!.length > 0) {
          setMode(otherMode);
        }
      }
    },
    [tokenizer.value, dictionaryEntries]
  );

  useEffect(function handleHistory() {
    const handlePopState = (evt?: PopStateEvent) => {
      evt?.preventDefault();

      const word = decodeURIComponent(document.location.hash.slice(1));

      setHighlight(word);
    };

    handlePopState();

    globalThis.addEventListener("popstate", handlePopState);

    return () => globalThis.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div class="app">
      <TokenTextarea
        value={input}
        loading={!tokenizer.fulfilled}
        tokens={tokenTokenizerTokens}
        highlight={highlight}
        onInput={(evt) => setInput(evt.currentTarget.value)}
      />

      <aside>
        <ModeSwitcher
          mode={mode}
          onChange={(evt) => {
            const needHighlightChange = !dictionaryEntries.some(
              (entry) => entry[evt.mode] === highlight
            );

            if (needHighlightChange) {
              const newHighlight = dictionaryEntries[0]?.[evt.mode];
              globalThis.location.href = "#" + newHighlight;
            }

            setMode(evt.mode);
          }}
        />

        <DictionaryPane
          word={dictionaryEntries.length > 0 ? highlight : undefined}
          variants={wordVariants}
          meanings={dictionaryEntries.map((entry) => ({
            pinyin: prettifyPinyin(entry.pinyin),
            explanation: prettifyExplanation(entry.english),
          }))}
          characters={[
            ...(dictionaryEntries.length > 0 && highlight != null
              ? highlight
              : ""),
          ].map((character) => {
            const entries = lookup(character, mode);
            const characterInfo = tokenizer.value?.lookupCharacter(character);

            return {
              character,
              variants: getVariants(character, entries ?? []),
              meanings:
                entries?.map((entry) => ({
                  pinyin: prettifyPinyin(entry.pinyin),
                  explanation: prettifyExplanation(entry.english),
                })) ?? [],
              decomposition: characterInfo?.decomposition,
              etymology:
                characterInfo?.etymology?.type !== "pictophonetic"
                  ? characterInfo?.etymology?.hint
                  : undefined,
            };
          })}
        />
      </aside>
    </div>
  );
};
