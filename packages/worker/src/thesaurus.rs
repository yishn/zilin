use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};

use crate::WordDictionary;

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
      let keywords = Self::extract_keywords(&entry.english);

      simplified.insert(entry.simplified.to_string(), keywords.clone());
      traditional.insert(entry.traditional.to_string(), keywords);
    }

    Self {
      simplified,
      traditional,
    }
  }

  fn extract_keywords(input: &str) -> HashSet<String> {
    let meanings = input.split("/").filter(|meaning| {
      !meaning.contains("classifier for")
        && !meaning.contains("surname ")
        && !meaning.contains("CL:")
    });

    let keywords = meanings.flat_map(|meaning| {
      if meaning.contains("variant of")
        || meaning.contains("abbr. for")
        || meaning.contains("also written")
        || meaning.contains("also called")
        || meaning.contains("also named")
        || meaning.contains("also pr.")
        || meaning.starts_with("see ")
      {
        HashSet::default()
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
            word.len() >= 3 && word != "the" && word != "are" && word != "sth"
          })
          // Remove words in parentheses and brackets
          .filter(|&word| !word.starts_with("(") || !word.ends_with(")"))
          .filter(|&word| !word.starts_with("[") || !word.ends_with("]"))
          .filter_map(|word| {
            if word.starts_with("(") {
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
    let dict = &*THESAURUS_DICT;

    println!("{:?}", dict.simplified.iter().take(100).collect::<Vec<_>>());
  }
}
