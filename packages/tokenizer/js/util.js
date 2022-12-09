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

export function createDecomposition(value, type, components) {
  return type != null
    ? {
        value,
        type,
        components,
      }
    : value != null
    ? value
    : null;
}
