use once_cell::sync::Lazy;
use std::io::{BufRead, BufReader};

use crate::trie::Trie;

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

  pub fn get_simplified_prefix<'a>(
    &'a self,
    word: &str,
  ) -> impl Iterator<Item = &'a WordEntry> + 'a {
    self.simplified.get_prefix(word).flat_map(|vec| vec.iter())
  }

  pub fn get_traditional_prefix<'a>(
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

#[cfg(test)]
mod tests {
  use crate::cedict::CEDICT_DATA;

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
      .get_simplified_prefix("中国")
      .collect::<Vec<_>>();

    assert!(data.len() > 2);
  }

  #[test]
  fn can_get_multiple_word_entries() {
    let data = CEDICT_DATA.get_simplified("沈").unwrap();

    assert_eq!(data.len(), 3);
  }
}
