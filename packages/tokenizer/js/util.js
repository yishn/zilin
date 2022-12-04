export function createToken(value, offset, line, column, entries) {
  return {
    value,
    offset,
    line,
    column,
    entries,
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
