export function prettifyPinyin(pinyin: string): string {
  const replacements = {
    a: ["ā", "á", "ǎ", "à"],
    A: ["Ā", "Á", "Ǎ", "À"],
    e: ["ē", "é", "ě", "è"],
    E: ["Ē", "É", "Ě", "È"],
    u: ["ū", "ú", "ǔ", "ù"],
    U: ["Ū", "Ú", "Ǔ", "Ù"],
    i: ["ī", "í", "ǐ", "ì"],
    I: ["Ī", "Í", "Ǐ", "Ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    O: ["Ō", "Ó", "Ǒ", "Ò"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
    Ü: ["Ǖ", "Ǘ", "Ǚ", "Ǜ"],
  } as const;

  const medials = ["i", "u", "ü"];

  return pinyin
    .replace(/(u:|v)/g, "ü")
    .split(/\s+/)
    .map((syllable) => {
      const tone = parseInt(syllable.slice(-1), 10);
      if (isNaN(tone)) return syllable;

      const letters = [...syllable.slice(0, -1)];

      for (let i = 0; i < letters.length; i++) {
        if (letters[i] in replacements) {
          if (
            medials.includes(letters[i].toLowerCase()) &&
            letters[i + 1] in replacements
          ) {
            continue;
          }

          letters[i] =
            replacements[letters[i] as keyof typeof replacements][tone - 1] ??
            letters[i];

          break;
        }
      }

      return letters.join("");
    })
    .join("");
}

export function prettifyExplanation(input: string): string {
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
