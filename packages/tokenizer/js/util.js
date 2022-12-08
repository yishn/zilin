export function createToken(value, offset, hasEntries) {
  return {
    value,
    offset,
    hasEntries,
  };
}

export function createWordEntry(traditional, simplified, pinyin, english) {
  return {
    traditional,
    simplified,
    pinyin,
    english,
  };
}

export function createCharacterEntry(data) {
  return JSON.parse(data);
}
