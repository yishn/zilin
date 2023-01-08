mod get_word_route;

use axum::{routing::get, Router, Server};
use get_word_route::*;
use once_cell::sync::Lazy;
use std::fs;
use zilin_worker::{SentenceDictionary, ThesaurusDictionary, WordDictionary};

pub static WORD_DICT: Lazy<WordDictionary> = Lazy::new(|| {
  let data = fs::read_to_string("./data/cedict_1_0_ts_utf-8_mdbg.txt")
    .expect("word dict data not found");

  WordDictionary::new(&data)
});

pub static SENTENCE_DICT: Lazy<SentenceDictionary> = Lazy::new(|| {
  let data = fs::read_to_string("./data/sentences.txt")
    .expect("sentence dict data not found");

  SentenceDictionary::new(&data, &WORD_DICT)
});

pub static THESAURUS_DICT: Lazy<ThesaurusDictionary> =
  Lazy::new(|| ThesaurusDictionary::new(&WORD_DICT));

#[tokio::main]
async fn main() {
  let _ = (&*WORD_DICT, &*SENTENCE_DICT, &*THESAURUS_DICT);

  let router = Router::new()
    .route("/", get(|| async { "Hello World!" }))
    .route("/word/:words", get(get_word_route));

  Server::bind(&"0.0.0.0:3000".parse().unwrap())
    .serve(router.into_make_service())
    .await
    .expect("server failed to start");
}
