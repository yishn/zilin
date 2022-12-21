use once_cell::sync::Lazy;
use rustc_hash::FxHashMap as HashMap;
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};

use crate::cedict::{lookup_simplified, lookup_traditional};

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
  #[serde(skip_serializing)]
  pub decomposition: String,
  pub etymology: Option<CharacterEtymology>,
  #[serde(skip_serializing)]
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

  pub fn iter(&self) -> impl Iterator<Item = &CharacterEntry> + '_ {
    self.data.values()
  }
}

pub fn lookup_character(character: char) -> Option<&'static CharacterEntry> {
  CHARACTER_DATA.get(character)
}

fn lookup_characters_including_component(
  component: char,
  simplified: bool,
) -> Vec<&'static CharacterEntry> {
  let mut result = CHARACTER_DATA
    .iter()
    .filter(|entry| entry.character != component)
    .filter(|entry| {
      decompose(entry.character)
        .iter_parts()
        .any(|ch| ch == component)
    })
    .filter(|entry| {
      let word = entry.character.to_string();

      if simplified {
        lookup_simplified(&word)
      } else {
        lookup_traditional(&word)
      }
      .is_some()
    })
    .collect::<Vec<_>>();

  result.sort_by_key(|entry| entry.strokes);
  result
}

pub fn lookup_simplified_characters_including_component(
  component: char,
) -> Vec<&'static CharacterEntry> {
  lookup_characters_including_component(component, true)
}

pub fn lookup_traditional_characters_including_component(
  component: char,
) -> Vec<&'static CharacterEntry> {
  lookup_characters_including_component(component, false)
}

#[derive(Debug, Clone)]
pub enum CharacterDecomposition {
  Unknown,
  Radical(char),
  Components {
    ty: char,
    value: Option<char>,
    components: Vec<CharacterDecomposition>,
  },
}

impl Default for CharacterDecomposition {
  fn default() -> Self {
    Self::Unknown
  }
}

impl CharacterDecomposition {
  pub fn iter_parts(&self) -> impl Iterator<Item = char> + '_ {
    match self {
      &CharacterDecomposition::Radical(ch) => Some(ch),
      _ => None,
    }
    .into_iter()
    .chain(
      match self {
        CharacterDecomposition::Components {
          value,
          components: parts,
          ..
        } => Some(value.clone().into_iter().chain(parts.iter().flat_map(
          |decomposition| {
            Box::new(decomposition.iter_parts())
              as Box<dyn Iterator<Item = char>>
          },
        ))),
        _ => None,
      }
      .into_iter()
      .flatten(),
    )
  }
}

pub fn decompose(character: char) -> CharacterDecomposition {
  fn inner(
    value: Option<char>,
    tokens: &mut dyn Iterator<Item = char>,
  ) -> CharacterDecomposition {
    if let Some(token) = tokens.next() {
      if token == '？' {
        return CharacterDecomposition::Unknown;
      } else if BINARY_DECOMPOSITION_TYPES.contains(&token)
        || TRINARY_DECOMPOSITION_TYPES.contains(&token)
      {
        return CharacterDecomposition::Components {
          ty: token,
          value,
          components: if TRINARY_DECOMPOSITION_TYPES.contains(&token) {
            vec![
              inner(None, tokens),
              inner(None, tokens),
              inner(None, tokens),
            ]
          } else {
            vec![inner(None, tokens), inner(None, tokens)]
          },
        };
      } else {
        return match decompose(token) {
          CharacterDecomposition::Unknown => {
            CharacterDecomposition::Radical(token)
          }
          decomposition => decomposition,
        };
      }
    }

    CharacterDecomposition::Unknown
  }

  inner(
    Some(character),
    &mut CHARACTER_DATA
      .get(character)
      .into_iter()
      .flat_map(|entry| entry.decomposition.chars()),
  )
}

#[cfg(test)]
mod tests {
  use super::CHARACTER_DATA;

  #[test]
  fn should_be_able_to_parse_dictionary_data() {
    let _ = *CHARACTER_DATA;
  }
}
