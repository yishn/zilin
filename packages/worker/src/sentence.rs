use rustc_hash::FxHashMap as HashMap;
use std::sync::Arc;

use crate::{WordDictionary, WordDictionaryType};

#[derive(Debug, Clone)]
pub struct SentenceEntry {
  tokens: Vec<(Arc<str>, Arc<str>)>,
  english: Arc<str>,
}

#[derive(Debug, Clone)]
pub struct SentenceDictionary {
  data: HashMap<Arc<str>, SentenceEntry>,
}

impl SentenceDictionary {
  pub fn new(data: &str, word_dict: &WordDictionary) -> Self {
    let mut map = HashMap::with_capacity_and_hasher(0, Default::default());

    for line in data.lines() {
      let mut fields = line.split("\t").skip(1);

      if let (Some(sentence), _, Some(english)) =
        (fields.next(), fields.next(), fields.next())
      {
        if map.contains_key(sentence) {
          continue;
        }

        let tokens = word_dict
          .tokenize(&sentence)
          .into_iter()
          .map(|token| {
            word_dict
              .get(&token.value, WordDictionaryType::Traditional)
              .or_else(|| {
                word_dict.get(&token.value, WordDictionaryType::Simplified)
              })
              .and_then(|entries| entries.first())
              .map(|entry| {
                (entry.simplified.clone(), entry.traditional.clone())
              })
              .unwrap_or_else(|| (token.value.clone(), token.value.clone()))
          })
          .collect::<Vec<_>>();

        map.insert(
          Arc::from(sentence),
          SentenceEntry {
            tokens,
            english: english.into(),
          },
        );
      }
    }

    Self { data: map }
  }

  pub fn iter_sentences_including_word<'a>(
    &'a self,
    word: &'a str,
    ty: WordDictionaryType,
  ) -> impl Iterator<Item = (String, &'a str)> {
    self
      .data
      .values()
      .filter(move |entry| {
        entry.tokens.iter().any(|(simplified, traditional)| {
          word
            == &**match ty {
              WordDictionaryType::Simplified => simplified,
              WordDictionaryType::Traditional => traditional,
            }
        })
      })
      .map(move |entry| {
        (
          entry
            .tokens
            .iter()
            .map(|(simplified, traditional)| match ty {
              WordDictionaryType::Simplified => &**simplified,
              WordDictionaryType::Traditional => &**traditional,
            })
            .collect::<String>(),
          &*entry.english,
        )
      })
  }
}

#[cfg(test)]
mod tests {
  use once_cell::sync::Lazy;

  use super::SentenceDictionary;
  use crate::WordDictionary;

  static CEDICT_DATA: Lazy<WordDictionary> = Lazy::new(|| {
    WordDictionary::new(include_str!(
      "../../../data/cedict_1_0_ts_utf-8_mdbg.txt"
    ))
  });

  static SENTENCES_DATA: Lazy<SentenceDictionary> = Lazy::new(|| {
    SentenceDictionary::new(
      include_str!("../../../data/sentences.txt"),
      &CEDICT_DATA,
    )
  });

  #[test]
  fn should_be_able_to_parse_dictionary_data() {
    let _ = &*SENTENCES_DATA;
  }
}
