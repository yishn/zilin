import * as React from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { CharacterDecomposition } from "../../../worker/pkg/zilin_worker.d.ts";
import { LinkifiedText } from "./LinkifiedText.tsx";
import { WordList } from "./WordList.tsx";

interface DecompositionTreeProps {
  decomposition?: CharacterDecomposition;
  maxDepth?: number;
}

const DecompositionTree: React.FunctionComponent<DecompositionTreeProps> = (
  props
) => {
  const decomposition = props.decomposition;
  const maxDepth = props.maxDepth ?? Infinity;

  return maxDepth < 0 ? null : (
    <div class="decomposition-tree">
      {decomposition == null ? (
        <p class="unknown">?</p>
      ) : typeof decomposition === "string" ? (
        <p class="radical">
          <LinkifiedText value={decomposition} />
        </p>
      ) : (
        <>
          <p class={decomposition.value == null ? "unknown" : ""}>
            {decomposition.value == null ? (
              "?"
            ) : (
              <LinkifiedText value={decomposition.value} />
            )}
          </p>

          {decomposition.components.some((component) => component != null) && (
            <ol>
              {decomposition.components.map((component) => (
                <li>
                  <DecompositionTree
                    decomposition={component}
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
  return (
    <ul class="meanings-list">
      {props.meanings?.map((entry, i) => (
        <li>
          <span class="pinyin">{entry.pinyin}</span>{" "}
          <span class="explanation">
            <LinkifiedText value={entry.explanation} handleSeparators={true} />
          </span>
        </li>
      ))}
    </ul>
  );
};

export interface DictionaryCharacterInfo {
  character: string;
  variants: string[];
  meanings: DictionaryMeaning[];
  decomposition?: CharacterDecomposition;
  etymology?: string;
  componentOf?: string[];
  characterOf?: string[];
}

export interface DictionaryPaneProps {
  word?: string;
  variants?: string[];
  meanings?: DictionaryMeaning[];
  characters?: DictionaryCharacterInfo[];
}

export const DictionaryPane: React.FunctionComponent<DictionaryPaneProps> = (
  props
) => {
  const charactersContainerRef = useRef<HTMLOListElement>(null);

  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);

  const oneCharacter = props.word?.length === 1;

  useEffect(
    function resetCurrentCharacter() {
      charactersContainerRef.current?.scrollTo({
        left: 0,
        behavior: "smooth",
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
                <LinkifiedText value={variant} />
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
              isNaN(scrollPercentage)
                ? 0
                : Math.round(
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
                      <LinkifiedText value={variant} />
                    </li>
                  ))}
                </ul>
              </header>

              <DecompositionTree
                decomposition={info.decomposition}
                maxDepth={2}
              />

              <MeaningsList meanings={info.meanings} />

              {info.etymology != null && (
                <p class="etymology">
                  <h3>Etymology:</h3> <LinkifiedText value={info.etymology} />
                </p>
              )}

              <WordList
                title="Character of"
                words={info.characterOf}
                length={10}
              />

              <WordList
                title="Component of"
                words={info.componentOf}
                length={20}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
