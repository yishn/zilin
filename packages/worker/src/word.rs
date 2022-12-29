use serde::Serialize;
use std::sync::Arc;

use crate::trie::Trie;

pub const CHINESE_PUNCTUATION: &'static [char] = &[
  '·', '×', '—', '‘', '’', '“', '”', '…', '、', '。', '《', '》', '『', '』',
  '【', '】', '！', '（', '）', '，', '：', '；', '？',
];

#[derive(Debug, PartialEq, Eq, Clone, Serialize)]
pub struct WordEntry {
  pub traditional: Arc<str>,
  pub simplified: Arc<str>,
  pub pinyin: Arc<str>,
  pub english: Arc<str>,
}

#[derive(Debug, PartialEq, Eq, Clone, Serialize)]
pub struct Token {
  pub value: Arc<str>,
  pub offset: usize,
  #[serde(rename = "hasEntries")]
  pub has_entries: bool,
}

#[derive(Debug, Clone)]
pub struct WordDictionary {
  simplified: Trie<Vec<WordEntry>>,
  traditional: Trie<Vec<WordEntry>>,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum WordDictionaryType {
  Simplified,
  Traditional,
}

impl WordDictionary {
  pub fn new(data: &str) -> Self {
    let mut result = Self {
      simplified: Trie::with_capacity(16_384),
      traditional: Trie::with_capacity(16_384),
    };

    for line in data.lines() {
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
          traditional: traditional.into(),
          simplified: simplified.into(),
          pinyin: pinyin.into(),
          english: english.into(),
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

  pub fn get(
    &self,
    word: &str,
    ty: WordDictionaryType,
  ) -> Option<&Vec<WordEntry>> {
    match ty {
      WordDictionaryType::Simplified => &self.simplified,
      WordDictionaryType::Traditional => &self.traditional,
    }
    .get(word)
  }

  pub fn iter_prefix(
    &self,
    word: &str,
    ty: WordDictionaryType,
  ) -> impl Iterator<Item = &WordEntry> {
    match ty {
      WordDictionaryType::Simplified => &self.simplified,
      WordDictionaryType::Traditional => &self.traditional,
    }
    .iter_prefix(word)
    .flat_map(|vec| vec.iter())
  }

  pub fn iter(
    &self,
    ty: WordDictionaryType,
  ) -> impl Iterator<Item = &WordEntry> {
    self.iter_prefix("", ty)
  }

  pub fn iter_including_subslice<'a>(
    &'a self,
    slice: &'a str,
    ty: WordDictionaryType,
  ) -> impl Iterator<Item = &'a WordEntry> {
    self.iter(ty).filter(move |entry| {
      let word = match ty {
        WordDictionaryType::Simplified => &entry.simplified,
        WordDictionaryType::Traditional => &entry.traditional,
      };

      &**word != slice && word.contains(slice)
    })
  }

  pub fn iter_homophones<'a>(
    &'a self,
    word: &'a str,
    ty: WordDictionaryType,
  ) -> impl Iterator<Item = (&'a WordEntry, bool)> {
    fn normalize_pinyin(pinyin: &str) -> String {
      pinyin
        .to_ascii_lowercase()
        .replace(|ch: char| ch.is_ascii_digit(), "")
    }

    let entries = self
      .get(word, ty)
      .map(|entries| entries.iter())
      .into_iter()
      .flatten();
    let exact_pinyins = entries
      .clone()
      .map(|entry| entry.pinyin.to_ascii_lowercase())
      .collect::<Vec<_>>();
    let normalized_pinyins = entries
      .clone()
      .map(|entry| normalize_pinyin(&entry.pinyin))
      .collect::<Vec<_>>();

    self
      .iter(ty)
      .filter(move |entry| {
        word
          != match ty {
            WordDictionaryType::Simplified => &*entry.simplified,
            WordDictionaryType::Traditional => &*entry.traditional,
          }
      })
      .filter_map(move |entry| {
        exact_pinyins
          .contains(&entry.pinyin.to_ascii_lowercase())
          .then(|| (entry, true))
          .or_else(|| {
            normalized_pinyins
              .contains(&normalize_pinyin(&entry.pinyin))
              .then(|| (entry, false))
          })
      })
  }

  pub fn tokenize(&self, input: &str) -> Vec<Token> {
    let mut chars = input.char_indices().peekable();
    let mut tokens = vec![];
    let mut offset = 0;

    let mut push_token = |word: &str| {
      tokens.push(Token {
        value: word.into(),
        offset,
        has_entries: self.get(word, WordDictionaryType::Simplified).is_some()
          || self.get(word, WordDictionaryType::Traditional).is_some(),
      });

      offset += word.chars().count();
    };

    while let Some((i, ch)) = chars.next() {
      // First, try to match two or more characters

      if let Some(&(_, next_ch)) = chars.peek() {
        let sliced_input = &input[i..];
        let prefix = [ch, next_ch].into_iter().collect::<String>();
        let mut found_word = None::<&str>;

        let entries = self
          .iter_prefix(&prefix, WordDictionaryType::Simplified)
          .chain(self.iter_prefix(&prefix, WordDictionaryType::Traditional));

        for entry in entries {
          let new_found_word = if sliced_input.starts_with(&*entry.simplified) {
            Some(&*entry.simplified)
          } else if sliced_input.starts_with(&*entry.traditional) {
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
            || self
              .get(&ch.to_string(), WordDictionaryType::Simplified)
              .map(|vec| vec.len() > 0)
              .unwrap_or(false)
            || self
              .get(&ch.to_string(), WordDictionaryType::Traditional)
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
}

#[cfg(test)]
mod tests {
  use once_cell::sync::Lazy;

  use super::{WordDictionary, WordDictionaryType};

  static CEDICT_DATA: Lazy<WordDictionary> = Lazy::new(|| {
    WordDictionary::new(include_str!(
      "../../../data/cedict_1_0_ts_utf-8_mdbg.txt"
    ))
  });

  #[test]
  fn can_get_word_entry() {
    let data = CEDICT_DATA
      .get("识字", WordDictionaryType::Simplified)
      .unwrap();

    assert_eq!(data.len(), 1);
    assert_eq!(&*data[0].simplified, "识字");
    assert_eq!(&*data[0].traditional, "識字");
  }

  #[test]
  fn can_get_all_words_with_prefix() {
    let data = CEDICT_DATA
      .iter_prefix("中国", WordDictionaryType::Simplified)
      .collect::<Vec<_>>();

    assert!(data.len() > 2);
  }

  #[test]
  fn can_get_multiple_word_entries() {
    let data = CEDICT_DATA
      .get("沈", WordDictionaryType::Simplified)
      .unwrap();

    assert_eq!(data.len(), 3);
  }

  #[test]
  fn should_tokenize_simple_sentence() {
    let tokens = CEDICT_DATA.tokenize("我是中国人。");

    assert_eq!(
      tokens.iter().map(|token| &*token.value).collect::<Vec<_>>(),
      vec!["我", "是", "中国人", "。"]
    );
  }

  #[test]
  fn should_handle_non_chinese_characters_gracefully() {
    let tokens = CEDICT_DATA.tokenize("我的名字叫David。");

    assert_eq!(
      tokens.iter().map(|token| &*token.value).collect::<Vec<_>>(),
      vec!["我", "的", "名字", "叫", "David", "。"]
    );
  }
}
