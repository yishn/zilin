export function createToken(value, offset, line, column, hasEntries) {
  return {
    value,
    offset,
    line,
    column,
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
