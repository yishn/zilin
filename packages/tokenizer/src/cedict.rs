use lazy_regex::regex_captures;
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

#[derive(Debug, Default, Clone)]
pub struct Cedict {
  simplified: Trie<Vec<CedictEntry>>,
  traditional: Trie<Vec<CedictEntry>>,
}

impl Cedict {
  pub fn new<'a, I>(data: I) -> Self
  where
    I: Iterator<Item = String>,
  {
    let mut result = Self::default();

    for line in data {
      if line.trim().is_empty() || line.trim().starts_with("#") {
        continue;
      }

      let captures =
        regex_captures!(r#"^(\S+)\s(\S+)\s\[([^\]]+)\]\s/(.+)/"#, &line);

      if let Some((_, traditional, simplified, pinyin, english)) = captures {
        let entry = CedictEntry {
          traditional: traditional.to_string(),
          simplified: simplified.to_string(),
          pinyin: pinyin.to_string(),
          english: english.to_string(),
        };

        result
          .simplified
          .get_mut_or_insert_default(simplified)
          .map(|vec| vec.push(entry.clone()));
        result
          .traditional
          .get_mut_or_insert_default(traditional)
          .map(|vec| vec.push(entry));
      }
    }

    result
  }

  pub fn get_simplified(&self, word: &str) -> Option<&Vec<CedictEntry>> {
    self.simplified.get(word)
  }

  pub fn get_traditional(&self, word: &str) -> Option<&Vec<CedictEntry>> {
    self.traditional.get(word)
  }

  pub fn get_simplified_prefix<'a>(
    &'a self,
    word: &str,
  ) -> impl Iterator<Item = &'a CedictEntry> + 'a {
    self.simplified.get_prefix(word).flat_map(|vec| vec.iter())
  }

  pub fn get_traditional_prefix<'a>(
    &'a self,
    word: &str,
  ) -> impl Iterator<Item = &'a CedictEntry> + 'a {
    self.traditional.get_prefix(word).flat_map(|vec| vec.iter())
  }
}

#[derive(Debug, Default, Clone)]
pub struct CedictEntry {
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
    let data = CEDICT_DATA.get_simplified_prefix("中国").collect::<Vec<_>>();

    assert!(data.len() > 2);
  }

  #[test]
  fn can_get_multiple_word_entries() {
    let data = CEDICT_DATA.get_simplified("沈").unwrap();

    assert_eq!(data.len(), 3);
  }
}
