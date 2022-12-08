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

export function createCharacterEntry(data, decomposition) {
  return Object.assign(JSON.parse(data), { decomposition });
}

export function createDecomposition(value, type, parts) {
  return type != null
    ? {
        value,
        type,
        parts,
      }
    : value != null
    ? value
    : null;
}
