use rustc_hash::FxHashMap as HashMap;
use serde::{Deserialize, Serialize};

pub const BINARY_DECOMPOSITION_TYPES: &[char] =
  &['⿰', '⿱', '⿴', '⿵', '⿶', '⿷', '⿸', '⿹', '⿺', '⿻'];

pub const TRINARY_DECOMPOSITION_TYPES: &[char] = &['⿲', '⿳'];

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
  #[serde(skip_serializing)]
  pub decomposition: String,
  pub etymology: Option<CharacterEtymology>,
  #[serde(skip_serializing)]
  pub matches: Vec<serde_json::Value>,
  #[serde(skip_deserializing)]
  pub strokes: usize,
}

#[derive(Debug, Clone)]
pub struct CharacterDictionary {
  data: HashMap<char, CharacterEntry>,
}

impl CharacterDictionary {
  pub fn new(data: &str) -> Self {
    let mut map = HashMap::with_capacity_and_hasher(16_384, Default::default());

    for line in data.lines() {
      if let Ok(mut entry) = serde_json::from_str::<CharacterEntry>(line) {
        entry.strokes = entry.matches.len();

        map.insert(entry.character, entry);
      }
    }

    Self { data: map }
  }

  pub fn get(&self, character: char) -> Option<&CharacterEntry> {
    self.data.get(&character)
  }

  pub fn stroke_count(&self, characters: &str) -> Option<usize> {
    characters
      .chars()
      .map(|ch| self.get(ch).map(|entry| entry.strokes))
      .sum::<Option<_>>()
  }

  pub fn iter(&self) -> impl Iterator<Item = &CharacterEntry> {
    self.data.values()
  }

  pub fn get_characters_including_component(
    &self,
    component: char,
  ) -> impl Iterator<Item = &CharacterEntry> {
    self
      .iter()
      .filter(move |entry| entry.character != component)
      .filter(move |entry| {
        self
          .decompose(entry.character)
          .iter_parts()
          .any(|ch| ch == component)
      })
  }

  pub fn decompose(&self, character: char) -> CharacterDecomposition {
    fn inner(
      dict: &CharacterDictionary,
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
                inner(dict, None, tokens),
                inner(dict, None, tokens),
                inner(dict, None, tokens),
              ]
            } else {
              vec![inner(dict, None, tokens), inner(dict, None, tokens)]
            },
          };
        } else {
          return match dict.decompose(token) {
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
      &self,
      Some(character),
      &mut self
        .get(character)
        .into_iter()
        .flat_map(|entry| entry.decomposition.chars()),
    )
  }
}

#[derive(Debug, PartialEq, Eq, Clone, Serialize)]
#[serde(untagged)]
pub enum CharacterDecomposition {
  Unknown,
  Radical(char),
  Components {
    #[serde(rename = "type")]
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

#[cfg(test)]
mod tests {
  use once_cell::sync::Lazy;

  use super::CharacterDictionary;

  static CHARACTER_DATA: Lazy<CharacterDictionary> = Lazy::new(|| {
    CharacterDictionary::new(include_str!("../../../data/dictionary.txt"))
  });

  #[test]
  fn should_be_able_to_parse_dictionary_data() {
    let _ = *CHARACTER_DATA;
  }
}
