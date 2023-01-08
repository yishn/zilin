use axum::{
  extract::{Path, Query},
  Json,
};
use serde::{Deserialize, Serialize};
use zilin_worker::{DictionaryType, WordEntry};

use crate::{SENTENCE_DICT, THESAURUS_DICT, WORD_DICT};

#[derive(Debug, Clone, Copy, Deserialize)]
pub struct DictionaryTypeQuery {
  simplified: Option<bool>,
  traditional: Option<bool>,
}

impl From<DictionaryTypeQuery> for DictionaryType {
  fn from(value: DictionaryTypeQuery) -> Self {
    if value.simplified.unwrap_or_default()
      && !value.traditional.unwrap_or_default()
    {
      DictionaryType::Simplified
    } else {
      DictionaryType::Traditional
    }
  }
}

#[derive(Debug, Serialize)]
pub struct WordResponse {
  meanings: &'static Vec<WordEntry>,
  similar: Vec<(&'static str, f32)>,
  sentences: Vec<(String, &'static str)>,
}

pub async fn get_word_route(
  Path(word): Path<String>,
  Query(query): Query<DictionaryTypeQuery>,
) -> Json<Option<WordResponse>> {
  let meanings = WORD_DICT.get(&word, query.into());

  let similar = THESAURUS_DICT
    .get_similar_words(&word, query.into())
    .into_iter()
    .take(10)
    .collect::<Vec<_>>();

  let sentences = {
    let mut result = SENTENCE_DICT
      .iter_sentences_including_word(&word, query.into())
      .collect::<Vec<_>>();

    result.sort_by_key(|(sentence, _)| sentence.len());
    result.into_iter().take(100).collect::<Vec<_>>()
  };

  Json(meanings.map(|meanings| WordResponse {
    meanings,
    similar,
    sentences,
  }))
}
