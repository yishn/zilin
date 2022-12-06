export function createToken(value, offset, hasEntries) {
  return {
    value,
    offset,
    hasEntries,
  };
}

export function createEntry(traditional, simplified, pinyin, english) {
  return {
    traditional,
    simplified,
    pinyin,
    english,
  };
}
