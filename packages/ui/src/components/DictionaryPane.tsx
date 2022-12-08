import * as React from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { CharacterDecomposition } from "../../../tokenizer/pkg/chinese_tokenizer.d.ts";
import { useAsync } from "../hooks/useAsync.ts";
import { loadTokenizer } from "../wasm.ts";

interface DecompositionTreeProps {
  decomposition?: CharacterDecomposition;
  maxDepth?: number;
}

const DecompositionTree: React.FunctionComponent<DecompositionTreeProps> = (
  props
) => {
  const decomposition = props.decomposition;
  const maxDepth = props.maxDepth ?? Infinity;

  const tokenizer = useAsync(() => loadTokenizer(), []);

  const hasWordEntry = (word: string) =>
    (tokenizer.value?.lookupSimplified(word).length ?? 0) > 0 ||
    (tokenizer.value?.lookupTraditional(word).length ?? 0) > 0;

  return maxDepth < 0 ? null : (
    <div class="decomposition-tree">
      {decomposition == null ? (
        <p class="unknown">?</p>
      ) : typeof decomposition === "string" ? (
        <p class="radical">
          {hasWordEntry(decomposition) ? (
            <a href={"#" + decomposition}>{decomposition}</a>
          ) : (
            decomposition
          )}
        </p>
      ) : (
        <>
          <p class={decomposition.value == null ? "unknown" : ""}>
            {decomposition.value == null ? (
              "?"
            ) : hasWordEntry(decomposition.value) ? (
              <a href={"#" + decomposition.value}>{decomposition.value}</a>
            ) : (
              decomposition.value
            )}
          </p>

          {decomposition.parts.some((part) => part != null) && (
            <ol>
              {decomposition.parts.map((part) => (
                <li>
                  <DecompositionTree
                    decomposition={part}
                    maxDepth={maxDepth - 1}
                  />
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
};

export interface DictionaryMeaning {
  pinyin: string;
  explanation: string;
}

interface MeaningsListProps {
  meanings?: DictionaryMeaning[];
}

const MeaningsList: React.FunctionComponent<MeaningsListProps> = (props) => {
  const explanationTokens = useAsync(async () => {
    const tokenizer = await loadTokenizer();

    return props.meanings?.map((meaning) =>
      tokenizer.tokenize(meaning.explanation)
    );
  }, props.meanings?.map((meaning) => meaning.explanation) ?? []);

  return (
    <ul class="meanings-list">
      {props.meanings?.map((entry, i) => (
        <li>
          <span class="pinyin">{entry.pinyin}</span>{" "}
          <span class="explanation">
            {explanationTokens.value?.[i] == null
              ? entry.explanation
              : explanationTokens.value[i].map((token) => {
                  if (token.hasEntries) {
                    return <a href={"#" + token.value}>{token.value}</a>;
                  } else if (token.value === "/" || token.value === "|") {
                    return <span class="separator">{token.value}</span>;
                  } else {
                    return token.value;
                  }
                })}
          </span>
        </li>
      ))}
    </ul>
  );
};

export interface DictionaryPaneProps {
  word?: string;
  variants?: string[];
  meanings?: DictionaryMeaning[];
  characters?: {
    character: string;
    variants: string[];
    meanings: DictionaryMeaning[];
    decomposition?: CharacterDecomposition;
  }[];
}

export const DictionaryPane: React.FunctionComponent<DictionaryPaneProps> = (
  props
) => {
  const charactersContainerRef = useRef<HTMLOListElement>(null);

  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);

  const oneCharacter = props.characters?.length === 1;

  useEffect(
    function resetCurrentCharacter() {
      charactersContainerRef.current?.scrollTo({
        left: 0,
      });

      setCurrentCharacterIndex(0);
    },
    [props.word]
  );

  return (
    <section class="dictionary-pane">
      {!oneCharacter && (
        <div class="word-info">
          <h1
            class={"word " + ((props.word?.length ?? 0) >= 4 ? "small " : "")}
          >
            {props.word}
          </h1>

          <ul class="variants">
            {props.variants?.map((variant) => (
              <li>
                <a href={"#" + variant}>{variant}</a>
              </li>
            ))}
          </ul>

          <MeaningsList meanings={props.meanings} />
        </div>
      )}

      <div class="character-info">
        <ol
          class={
            "navigation " +
            ((props.characters?.length ?? 0) <= 1 ? "hide " : "")
          }
        >
          {props.characters?.map((info, i) => (
            <li class={i === currentCharacterIndex ? "current" : ""}>
              <a
                href="#"
                title={info.character}
                onClick={(evt) => {
                  evt.preventDefault();

                  const targetElement = charactersContainerRef.current
                    ?.children[i] as HTMLElement | undefined;

                  if (targetElement != null) {
                    charactersContainerRef.current?.scrollTo({
                      left: targetElement.offsetLeft,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                {info.character}
              </a>
            </li>
          ))}
        </ol>

        <ol
          ref={charactersContainerRef}
          class="characters"
          onScroll={(evt) => {
            const scrollPercentage =
              evt.currentTarget.scrollLeft /
              (evt.currentTarget.scrollWidth - evt.currentTarget.offsetWidth);

            setCurrentCharacterIndex(
              Math.round(
                scrollPercentage * ((props.characters?.length ?? 1) - 1)
              )
            );
          }}
        >
          {props.characters?.map((info) => (
            <li>
              <header>
                <h1 class={"word " + (!oneCharacter ? "small " : "")}>
                  {info.character}
                </h1>

                <ul class="variants">
                  {info.variants?.map((variant) => (
                    <li>
                      <a href={"#" + variant}>{variant}</a>
                    </li>
                  ))}
                </ul>
              </header>

              <DecompositionTree
                decomposition={info.decomposition}
                maxDepth={2}
              />

              <MeaningsList meanings={info.meanings} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
