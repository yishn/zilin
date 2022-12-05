mod cedict;
mod trie;
mod wasm;

use cedict::{CedictEntry, CEDICT_DATA};

pub const CHINESE_PUNCTUATION: &'static [char] = &[
  '·', '×', '—', '‘', '’', '“', '”', '…', '、', '。', '《', '》', '『', '』',
  '【', '】', '！', '（', '）', '，', '：', '；', '？',
];

#[derive(Debug, Clone)]
pub struct Token {
  pub value: String,
  pub offset: usize,
  pub line: usize,
  pub column: usize,
  pub entries: Option<&'static Vec<CedictEntry>>,
}

pub fn tokenize(input: &str) -> Vec<Token> {
  let chars = input.char_indices().collect::<Vec<_>>();
  let mut tokens = vec![];
  let (mut offset, mut line, mut column) = (0, 0, 0);
  let (mut simplified_count, mut traditional_count) = (0, 0);

  macro_rules! push_token {
    ($word:expr) => {{
      let simplified_entries = CEDICT_DATA.get_simplified($word);
      let traditional_entries = CEDICT_DATA.get_traditional($word);

      let entries =
        if simplified_entries.map(|vec| vec.len() == 0).unwrap_or(true) {
          traditional_count += 1;
          traditional_entries
        } else if traditional_entries
          .map(|vec| vec.len() == 0)
          .unwrap_or(true)
        {
          simplified_count += 1;
          simplified_entries
        } else if simplified_count < traditional_count {
          traditional_entries
        } else if simplified_count > traditional_count {
          simplified_entries
        } else {
          simplified_entries
        };

      tokens.push(Token {
        value: $word.to_string(),
        offset,
        line,
        column,
        entries,
      });

      let word_chars = $word.chars().collect::<Vec<_>>();
      let last_line_break_index = word_chars
        .iter()
        .enumerate()
        .rev()
        .find(|&(_, &c)| c == '\n')
        .map(|(i, _)| i);

      offset += word_chars.len();
      line += word_chars.iter().filter(|&&x| x == '\n').count();
      column = last_line_break_index
        .map(|i| word_chars.len() - i)
        .unwrap_or_else(|| column + word_chars.len());
    }};
  }

  while offset < chars.len() {
    // First, try to match two or more characters

    if offset < chars.len() - 1 {
      let sliced_input = &input[chars[offset].0..];
      let prefix = chars[offset..offset + 2]
        .iter()
        .map(|&(_, c)| c)
        .collect::<String>();
      let mut found_word = None::<&str>;

      let entries = CEDICT_DATA
        .get_simplified_prefix(&prefix)
        .chain(CEDICT_DATA.get_traditional_prefix(&prefix));

      for entry in entries {
        let new_found_word = if sliced_input.starts_with(&entry.simplified) {
          Some(&entry.simplified)
        } else if sliced_input.starts_with(&entry.traditional) {
          Some(&entry.traditional)
        } else {
          None
        };

        found_word = match (found_word, new_found_word) {
          (Some(found_word), Some(new_found_word))
            if found_word.len() < new_found_word.len() =>
          {
            Some(new_found_word)
          }
          (None, _) => new_found_word.map(|x| &**x),
          _ => found_word,
        };
      }

      if let Some(found_word) = found_word {
        push_token!(found_word);
        continue;
      }
    }

    // Match one Chinese character

    let ch = chars[offset].1;
    let is_chinese = |ch: char| {
      CHINESE_PUNCTUATION.contains(&ch)
        || CEDICT_DATA
          .get_simplified(&ch.to_string())
          .map(|vec| vec.len() > 0)
          .unwrap_or(false)
        || CEDICT_DATA
          .get_traditional(&ch.to_string())
          .map(|vec| vec.len() > 0)
          .unwrap_or(false)
    };

    if is_chinese(ch) || ch.is_whitespace() {
      push_token!(&ch.to_string());
      continue;
    }

    // Handle non-Chinese characters

    let end = (offset + 1..chars.len())
      .find(|&i| chars[i].1.is_whitespace() || is_chinese(chars[i].1))
      .map(|i| chars[i].0);

    let word = end
      .map(|end| &input[chars[offset].0..end])
      .unwrap_or(&input[chars[offset].0..]);

    push_token!(word);
  }

  tokens
}

pub fn lookup_simplified(word: &str) -> Option<&'static Vec<CedictEntry>> {
  CEDICT_DATA.get_simplified(word)
}

pub fn lookup_traditional(word: &str) -> Option<&'static Vec<CedictEntry>> {
  CEDICT_DATA.get_traditional(word)
}

#[cfg(test)]
mod tests {
  use crate::tokenize;

  #[test]
  fn should_tokenize_simple_sentence() {
    let tokens = tokenize("我是中国人。");

    assert_eq!(
      tokens.iter().map(|token| &token.value).collect::<Vec<_>>(),
      vec!["我", "是", "中国人", "。"]
    );
  }

  #[test]
  fn should_handle_non_chinese_characters_gracefully() {
    let tokens = tokenize("我的名字叫David。");

    assert_eq!(
      tokens.iter().map(|token| &token.value).collect::<Vec<_>>(),
      vec!["我", "的", "名字", "叫", "David", "。"]
    );
  }
}
