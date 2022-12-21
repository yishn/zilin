use once_cell::sync::Lazy;
use std::io::{BufRead, BufReader};

use crate::{character::lookup_character, trie::Trie};

pub const CHINESE_PUNCTUATION: &'static [char] = &[
  '·', '×', '—', '‘', '’', '“', '”', '…', '、', '。', '《', '》', '『', '』',
  '【', '】', '！', '（', '）', '，', '：', '；', '？',
];

pub static CEDICT_DATA_GZ: &'static [u8] =
  include_bytes!("../data/cedict_1_0_ts_utf-8_mdbg.txt.gz");

pub static CEDICT_DATA: Lazy<Cedict> = Lazy::new(|| {
  let (reader, _) = niffler::get_reader(Box::new(CEDICT_DATA_GZ)).unwrap();
  let buf_reader = BufReader::new(reader);

  Cedict::new(buf_reader.lines().map(|line| line.unwrap()))
});

#[derive(Debug, Clone)]
pub struct Cedict {
  simplified: Trie<Vec<WordEntry>>,
  traditional: Trie<Vec<WordEntry>>,
}

impl Cedict {
  pub fn new(data: impl Iterator<Item = String>) -> Self {
    let mut result = Self {
      simplified: Trie::with_capacity(16_384),
      traditional: Trie::with_capacity(16_384),
    };

    for line in data {
      let line = line.trim();

      if line.is_empty() || line.starts_with("#") {
        continue;
      }

      let mut tokens = line.split_ascii_whitespace();
      let traditional = tokens.next();
      let simplified = tokens.next();

      let pinyin = {
        let mut result = String::new();

        while let Some(token) = tokens.next() {
          result += token;

          if token.ends_with("]") {
            break;
          } else {
            result.push(' ');
          }
        }

        result
      };
      let pinyin = &pinyin[1..pinyin.len() - 1];

      let english = tokens.collect::<Vec<_>>().join(" ");
      let english = english.trim();
      let english = &english[1..english.len() - 1];

      if let (Some(traditional), Some(simplified)) = (traditional, simplified) {
        if traditional.is_ascii() || simplified.is_ascii() {
          continue;
        }

        let entry = WordEntry {
          traditional: traditional.to_string(),
          simplified: simplified.to_string(),
          pinyin: pinyin.to_string(),
          english: (english).to_string(),
        };

        result
          .simplified
          .get_mut_or_insert(simplified, || Vec::with_capacity(1))
          .map(|vec| vec.push(entry.clone()));
        result
          .traditional
          .get_mut_or_insert(traditional, || Vec::with_capacity(1))
          .map(|vec| vec.push(entry));
      }
    }

    result
  }

  pub fn get_simplified(&self, word: &str) -> Option<&Vec<WordEntry>> {
    self.simplified.get(word)
  }

  pub fn get_traditional(&self, word: &str) -> Option<&Vec<WordEntry>> {
    self.traditional.get(word)
  }

  pub fn iter_simplified_prefix<'a>(
    &'a self,
    word: &str,
  ) -> impl Iterator<Item = &'a WordEntry> + 'a {
    self.simplified.get_prefix(word).flat_map(|vec| vec.iter())
  }

  pub fn iter_traditional_prefix<'a>(
    &'a self,
    word: &str,
  ) -> impl Iterator<Item = &'a WordEntry> + 'a {
    self.traditional.get_prefix(word).flat_map(|vec| vec.iter())
  }
}

#[derive(Debug, Default, Clone)]
pub struct WordEntry {
  pub traditional: String,
  pub simplified: String,
  pub pinyin: String,
  pub english: String,
}

pub fn lookup_simplified(word: &str) -> Option<&'static Vec<WordEntry>> {
  CEDICT_DATA.get_simplified(word)
}

pub fn lookup_traditional(word: &str) -> Option<&'static Vec<WordEntry>> {
  CEDICT_DATA.get_traditional(word)
}

fn lookup_words_including_subslice(
  slice: &str,
  simplified: bool,
) -> Vec<&'static WordEntry> {
  let mut result = simplified
    .then(|| CEDICT_DATA.iter_simplified_prefix(""))
    .into_iter()
    .flatten()
    .chain(
      (!simplified)
        .then(|| CEDICT_DATA.iter_traditional_prefix(""))
        .into_iter()
        .flatten(),
    )
    .filter(|entry| {
      let word = if simplified {
        &entry.simplified
      } else {
        &entry.traditional
      };

      word != slice && word.contains(slice)
    })
    .collect::<Vec<_>>();

  result.sort_by_cached_key(|entry| {
    if simplified {
      &entry.simplified
    } else {
      &entry.traditional
    }
    .chars()
    .map(|ch| lookup_character(ch).map(|entry| entry.strokes))
    .sum::<Option<usize>>()
    .unwrap_or(usize::MAX)
  });
  result
}

pub fn lookup_simplified_including_subslice(
  slice: &str,
) -> Vec<&'static WordEntry> {
  lookup_words_including_subslice(slice, true)
}

pub fn lookup_traditional_with_subslice(
  slice: &str,
) -> Vec<&'static WordEntry> {
  lookup_words_including_subslice(slice, false)
}

#[derive(Debug, Clone)]
pub struct Token {
  pub value: String,
  pub offset: usize,
  pub has_entries: bool,
}

pub fn tokenize(input: &str) -> Vec<Token> {
  let mut chars = input.char_indices().peekable();
  let mut tokens = vec![];
  let mut offset = 0;

  let mut push_token = |word: &str| {
    tokens.push(Token {
      value: word.to_string(),
      offset,
      has_entries: CEDICT_DATA.get_simplified(word).is_some()
        || CEDICT_DATA.get_traditional(word).is_some(),
    });

    offset += word.chars().count();
  };

  while let Some((i, ch)) = chars.next() {
    // First, try to match two or more characters

    if let Some(&(_, next_ch)) = chars.peek() {
      let sliced_input = &input[i..];
      let prefix = [ch, next_ch].into_iter().collect::<String>();
      let mut found_word = None::<&str>;

      let entries = CEDICT_DATA
        .iter_simplified_prefix(&prefix)
        .chain(CEDICT_DATA.iter_traditional_prefix(&prefix));

      for entry in entries {
        let new_found_word = if sliced_input.starts_with(&entry.simplified) {
          Some(&*entry.simplified)
        } else if sliced_input.starts_with(&entry.traditional) {
          Some(&*entry.traditional)
        } else {
          None
        };

        found_word = match (found_word, new_found_word) {
          (Some(found_word), Some(new_found_word))
            if found_word.len() < new_found_word.len() =>
          {
            Some(new_found_word)
          }
          (None, _) => new_found_word,
          _ => found_word,
        };
      }

      if let Some(found_word) = found_word {
        push_token(found_word);

        for _ in 0..found_word.chars().count() - 1 {
          chars.next();
        }

        continue;
      }
    }

    // Match exactly one Chinese character

    let is_chinese = |ch: &char| {
      !ch.is_ascii_alphanumeric()
        && (CHINESE_PUNCTUATION.contains(&ch)
          || CEDICT_DATA
            .get_simplified(&ch.to_string())
            .map(|vec| vec.len() > 0)
            .unwrap_or(false)
          || CEDICT_DATA
            .get_traditional(&ch.to_string())
            .map(|vec| vec.len() > 0)
            .unwrap_or(false))
    };

    if ch.is_ascii_whitespace() || is_chinese(&ch) {
      push_token(&ch.to_string());
      continue;
    }

    // Handle non-Chinese characters

    let mut word = String::new();

    word.push(ch);

    while let Some((_, next_ch)) = chars.peek() {
      if next_ch.is_ascii_whitespace() || is_chinese(next_ch) {
        break;
      }

      word.push(*next_ch);
      chars.next();
    }

    push_token(&word);
  }

  tokens
}

#[cfg(test)]
mod tests {
  use crate::cedict::{CEDICT_DATA, tokenize};

  #[test]
  fn can_get_word_entry() {
    let data = CEDICT_DATA.get_simplified("识字").unwrap();

    assert_eq!(data.len(), 1);
    assert_eq!(data[0].simplified, "识字");
    assert_eq!(data[0].traditional, "識字");
  }

  #[test]
  fn can_get_all_words_with_prefix() {
    let data = CEDICT_DATA
      .iter_simplified_prefix("中国")
      .collect::<Vec<_>>();

    assert!(data.len() > 2);
  }

  #[test]
  fn can_get_multiple_word_entries() {
    let data = CEDICT_DATA.get_simplified("沈").unwrap();

    assert_eq!(data.len(), 3);
  }

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
