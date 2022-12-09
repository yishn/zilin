use once_cell::sync::Lazy;
use rustc_hash::FxHashMap as HashMap;
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};

pub const BINARY_DECOMPOSITION_TYPES: &[char] =
  &['⿰', '⿱', '⿴', '⿵', '⿶', '⿷', '⿸', '⿹', '⿺', '⿻'];

pub const TRINARY_DECOMPOSITION_TYPES: &[char] = &['⿲', '⿳'];

pub static CHARACTER_DATA_GZ: &'static [u8] =
  include_bytes!("../data/dictionary.txt.gz");

pub static CHARACTER_DATA: Lazy<Dictionary> = Lazy::new(|| {
  let (reader, _) = niffler::get_reader(Box::new(CHARACTER_DATA_GZ)).unwrap();
  let buf_reader = BufReader::new(reader);

  Dictionary::new(buf_reader.lines().map(|line| line.unwrap()))
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterEtymology {
  #[serde(rename = "type")]
  pub ty: String,
  pub hint: Option<String>,
  pub phonetic: Option<String>,
  pub semantic: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterEntry {
  pub character: char,
  pub definition: Option<String>,
  pub pinyin: Vec<String>,
  pub decomposition: String,
  pub etymology: Option<CharacterEtymology>,
  pub matches: Vec<serde_json::Value>,
  #[serde(skip_deserializing)]
  pub strokes: usize,
}

#[derive(Debug, Clone)]
pub struct Dictionary {
  data: HashMap<char, CharacterEntry>,
}

impl Dictionary {
  pub fn new(data: impl Iterator<Item = String>) -> Self {
    let mut map = HashMap::with_capacity_and_hasher(16_384, Default::default());

    for line in data {
      let mut entry = serde_json::from_str::<CharacterEntry>(&line).unwrap();
      entry.strokes = entry.matches.len();

      map.insert(entry.character, entry);
    }

    Self { data: map }
  }

  pub fn get(&self, character: char) -> Option<&CharacterEntry> {
    self.data.get(&character)
  }
}

#[cfg(test)]
mod tests {
  use super::CHARACTER_DATA;

  #[test]
  fn should_be_able_to_parse_dictionary_data() {
    let _ = *CHARACTER_DATA;
  }
}
