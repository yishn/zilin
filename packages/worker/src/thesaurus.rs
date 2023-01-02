use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};
use std::cmp::Ordering;

use crate::{DictionaryType, WordDictionary};

#[derive(Debug, Clone)]
pub struct ThesaurusDictionary {
  simplified: HashMap<String, HashSet<String>>,
  traditional: HashMap<String, HashSet<String>>,
}

impl ThesaurusDictionary {
  pub fn new(data: &WordDictionary) -> Self {
    let capacity = data.iter().count();
    let mut simplified =
      HashMap::with_capacity_and_hasher(capacity, Default::default());
    let mut traditional =
      HashMap::with_capacity_and_hasher(capacity, Default::default());

    for entry in data.iter().filter(|entry| {
      // Ensure entry is not referring to a proper noun
      entry
        .pinyin
        .chars()
        .next()
        .map(|first_char| !first_char.is_ascii_uppercase())
        .unwrap_or_default()
    }) {
      let keywords = Self::extract_keywords(&entry.english, data);

      simplified
        .entry(entry.simplified.to_string())
        .or_insert(HashSet::default())
        .extend(keywords.clone().into_iter());
      traditional
        .entry(entry.traditional.to_string())
        .or_insert(HashSet::default())
        .extend(keywords.into_iter());
    }

    Self {
      simplified,
      traditional,
    }
  }

  fn extract_keywords(
    input: &str,
    word_dict: &WordDictionary,
  ) -> HashSet<String> {
    let meanings = input.split("/").filter(|meaning| {
      !meaning.contains("classifier for")
        && !meaning.contains("variant of")
        && !meaning.contains("surname ")
        && !meaning.contains("CL:")
    });

    let keywords = meanings.flat_map(|meaning| {
      if meaning.contains("abbr. for")
        || meaning.contains("also written")
        || meaning.contains("also called")
        || meaning.contains("also named")
        || meaning.contains("also pr.")
        || meaning.starts_with("see ")
      {
        word_dict
          .tokenize(meaning)
          .into_iter()
          .filter(|token| token.has_entries)
          .map(|token| token.value.to_string())
          .collect()
      } else {
        let mut in_parentheses = false;
        let mut in_brackets = false;

        meaning
          .replace(
            |ch: char| {
              ch.is_ascii_punctuation() && !['(', ')', '[', ']'].contains(&ch)
            },
            " ",
          )
          .split_ascii_whitespace()
          .filter(|&word| {
            word.len() >= 3
              && word != "the"
              && word != "are"
              && word != "sth"
              && word != "very"
          })
          .filter_map(|word| {
            // Remove words in parentheses and brackets

            if word.starts_with("(") && word.ends_with(")")
              || word.starts_with("[") && word.ends_with("]")
            {
              return None;
            } else if word.starts_with("(") {
              in_parentheses = true;
            } else if word.starts_with("[") {
              in_brackets = true
            } else if word.ends_with(")") {
              in_parentheses = false;
              return None;
            } else if word.ends_with("]") {
              in_brackets = false;
              return None;
            }

            (!in_parentheses && !in_brackets).then(|| word)
          })
          .map(|word| word.to_string())
          .collect::<HashSet<_>>()
      }
    });

    keywords.collect()
  }

  fn calculate_similarity_score(
    bag1: &HashSet<String>,
    bag2: &HashSet<String>,
  ) -> f32 {
    bag1.intersection(bag2).count() as f32 / bag1.union(bag2).count() as f32
  }

  pub fn get_similar_words(
    &self,
    word: &str,
    ty: DictionaryType,
  ) -> Vec<(&str, f32)> {
    let map = match ty {
      DictionaryType::Simplified => &self.simplified,
      DictionaryType::Traditional => &self.traditional,
    };

    map
      .get(word)
      .map(|bag1| {
        let mut result = map
          .iter()
          .filter(|&(w, _)| w != word)
          .map(|(w, bag2)| {
            if bag1.contains(w) {
              (&**w, 1.0)
            } else {
              (&**w, Self::calculate_similarity_score(bag1, bag2))
            }
          })
          .filter(|&(_, score)| score.is_finite() && score > 0.0)
          .collect::<Vec<_>>();

        result.sort_by(|(_, x), (_, y)| {
          y.partial_cmp(x).unwrap_or(Ordering::Equal)
        });
        result
      })
      .unwrap_or_default()
  }
}

#[cfg(test)]
mod tests {
  use once_cell::sync::Lazy;

  use super::WordDictionary;
  use crate::ThesaurusDictionary;

  static WORD_DICT: Lazy<WordDictionary> = Lazy::new(|| {
    WordDictionary::new(include_str!(
      "../../../data/cedict_1_0_ts_utf-8_mdbg.txt"
    ))
  });

  static THESAURUS_DICT: Lazy<ThesaurusDictionary> =
    Lazy::new(|| ThesaurusDictionary::new(&WORD_DICT));

  #[test]
  fn should_be_able_to_parse_thesaurus_data() {
    let _ = &*THESAURUS_DICT;
  }
}
