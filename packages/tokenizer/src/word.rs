use serde::Serialize;

use crate::trie::Trie;

pub const CHINESE_PUNCTUATION: &'static [char] = &[
  '·', '×', '—', '‘', '’', '“', '”', '…', '、', '。', '《', '》', '『', '』',
  '【', '】', '！', '（', '）', '，', '：', '；', '？',
];

#[derive(Debug, Default, PartialEq, Eq, Clone, Serialize)]
pub struct WordEntry {
  pub traditional: String,
  pub simplified: String,
  pub pinyin: String,
  pub english: String,
}

#[derive(Debug, PartialEq, Eq, Clone, Serialize)]
pub struct Token {
  pub value: String,
  pub offset: usize,
  #[serde(rename = "hasEntries")]
  pub has_entries: bool,
}

#[derive(Debug, Clone)]
pub struct WordDictionary {
  simplified: Trie<Vec<WordEntry>>,
  traditional: Trie<Vec<WordEntry>>,
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

  pub fn iter_simplified_prefix(
    &self,
    word: &str,
  ) -> impl Iterator<Item = &WordEntry> {
    self.simplified.iter_prefix(word).flat_map(|vec| vec.iter())
  }

  pub fn iter_traditional_prefix<'a>(
    &self,
    word: &str,
  ) -> impl Iterator<Item = &WordEntry> {
    self
      .traditional
      .iter_prefix(word)
      .flat_map(|vec| vec.iter())
  }

  pub fn iter_simplified(&self) -> impl Iterator<Item = &WordEntry> {
    self.iter_simplified_prefix("")
  }

  pub fn iter_traditional(&self) -> impl Iterator<Item = &WordEntry> {
    self.iter_traditional_prefix("")
  }

  fn iter_words_including_subslice<'a>(
    &'a self,
    slice: &'a str,
    simplified: bool,
  ) -> impl Iterator<Item = &'a WordEntry> {
    simplified
      .then(|| self.iter_simplified())
      .into_iter()
      .flatten()
      .chain(
        (!simplified)
          .then(|| self.iter_traditional())
          .into_iter()
          .flatten(),
      )
      .filter(move |entry| {
        let word = if simplified {
          &entry.simplified
        } else {
          &entry.traditional
        };

        word != slice && word.contains(slice)
      })
  }

  pub fn iter_simplified_including_subslice<'a>(
    &'a self,
    slice: &'a str,
  ) -> impl Iterator<Item = &'a WordEntry> {
    self.iter_words_including_subslice(slice, true)
  }

  pub fn iter_traditional_including_subslice<'a>(
    &'a self,
    slice: &'a str,
  ) -> impl Iterator<Item = &'a WordEntry> {
    self.iter_words_including_subslice(slice, false)
  }

  pub fn tokenize(&self, input: &str) -> Vec<Token> {
    let mut chars = input.char_indices().peekable();
    let mut tokens = vec![];
    let mut offset = 0;

    let mut push_token = |word: &str| {
      tokens.push(Token {
        value: word.to_string(),
        offset,
        has_entries: self.get_simplified(word).is_some()
          || self.get_traditional(word).is_some(),
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
          .iter_simplified_prefix(&prefix)
          .chain(self.iter_traditional_prefix(&prefix));

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
            || self
              .get_simplified(&ch.to_string())
              .map(|vec| vec.len() > 0)
              .unwrap_or(false)
            || self
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
}

#[cfg(test)]
mod tests {
  use once_cell::sync::Lazy;

  use super::WordDictionary;

  static CEDICT_DATA: Lazy<WordDictionary> = Lazy::new(|| {
    WordDictionary::new(include_str!(
      "../../../data/cedict_1_0_ts_utf-8_mdbg.txt"
    ))
  });

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
    let tokens = CEDICT_DATA.tokenize("我是中国人。");

    assert_eq!(
      tokens.iter().map(|token| &token.value).collect::<Vec<_>>(),
      vec!["我", "是", "中国人", "。"]
    );
  }

  #[test]
  fn should_handle_non_chinese_characters_gracefully() {
    let tokens = CEDICT_DATA.tokenize("我的名字叫David。");

    assert_eq!(
      tokens.iter().map(|token| &token.value).collect::<Vec<_>>(),
      vec!["我", "的", "名字", "叫", "David", "。"]
    );
  }
}
