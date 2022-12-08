import { loadTokenizer } from "./wasm.ts";

const binaryDecompositionTypes = [
  "⿰",
  "⿱",
  "⿴",
  "⿵",
  "⿶",
  "⿷",
  "⿸",
  "⿹",
  "⿺",
  "⿻",
] as const;

const trinaryDecompositionTypes = ["⿲", "⿳"] as const;

export type CharacterDecomposition =
  | null
  | string
  | {
    type:
      | typeof binaryDecompositionTypes[number]
      | typeof trinaryDecompositionTypes[number];
    value?: string;
    parts: CharacterDecomposition[];
  };

export async function parseDecomposition(
  value: string | null,
  decompositionTokens?: string[],
): Promise<CharacterDecomposition> {
  const tokenizer = await loadTokenizer();

  if (decompositionTokens == null) {
    if (value == null) return null;

    decompositionTokens = [
      ...(tokenizer.lookupCharacter(value)?.decomposition ?? ""),
    ];
  }

  while (decompositionTokens.length > 0) {
    const token = decompositionTokens.shift()!;

    if (token === "？") {
      return value;
    } else if (
      (binaryDecompositionTypes as readonly string[]).includes(token) ||
      (trinaryDecompositionTypes as readonly string[]).includes(token)
    ) {
      return {
        type: token as
          | typeof binaryDecompositionTypes[number]
          | typeof trinaryDecompositionTypes[number],
        value: value ?? undefined,
        parts: await Promise.all(
          [...Array(
            (trinaryDecompositionTypes as readonly string[]).includes(token)
              ? 3
              : 2,
          )].map((_) => parseDecomposition(null, decompositionTokens)),
        ),
      };
    } else {
      return (await parseDecomposition(token)) ?? token;
    }
  }

  return null;
}
