mod cedict;
mod character;
mod trie;
pub mod wasm;

use cedict::{WordEntry, CEDICT_DATA};
use character::{
  CharacterEntry, BINARY_DECOMPOSITION_TYPES, CHARACTER_DATA,
  TRINARY_DECOMPOSITION_TYPES,
};

pub const CHINESE_PUNCTUATION: &'static [char] = &[
  '·', '×', '—', '‘', '’', '“', '”', '…', '、', '。', '《', '》', '『', '』',
  '【', '】', '！', '（', '）', '，', '：', '；', '？',
];

#[derive(Debug, Clone)]
pub struct Token {
  pub value: String,
  pub offset: usize,
  pub has_entries: bool,
}

pub fn tokenize(input: &str) -> Vec<Token> {
  let mut chars = input.char_indices().peekable();
  let mut tokens = vec![];
  let mut offset = 0;

  let mut push_token = |word: &str| {
    tokens.push(Token {
      value: word.to_string(),
      offset,
      has_entries: CEDICT_DATA.get_simplified(word).is_some()
        || CEDICT_DATA.get_traditional(word).is_some(),
    });

    offset += word.chars().count();
  };

  while let Some((i, ch)) = chars.next() {
    // First, try to match two or more characters

    if let Some(&(_, next_ch)) = chars.peek() {
      let sliced_input = &input[i..];
      let prefix = [ch, next_ch].into_iter().collect::<String>();
      let mut found_word = None::<&str>;

      let entries = CEDICT_DATA
        .iter_simplified_prefix(&prefix)
        .chain(CEDICT_DATA.iter_traditional_prefix(&prefix));

      for entry in entries {
        let new_found_word = if sliced_input.starts_with(&entry.simplified) {
          Some(&*entry.simplified)
        } else if sliced_input.starts_with(&entry.traditional) {
          Some(&*entry.traditional)
        } else {
          None
        };

        found_word = match (found_word, new_found_word) {
          (Some(found_word), Some(new_found_word))
            if found_word.len() < new_found_word.len() =>
          {
            Some(new_found_word)
          }
          (None, _) => new_found_word,
          _ => found_word,
        };
      }

      if let Some(found_word) = found_word {
        push_token(found_word);

        for _ in 0..found_word.chars().count() - 1 {
          chars.next();
        }

        continue;
      }
    }

    // Match exactly one Chinese character

    let is_chinese = |ch: &char| {
      !ch.is_ascii_alphanumeric()
        && (CHINESE_PUNCTUATION.contains(&ch)
          || CEDICT_DATA
            .get_simplified(&ch.to_string())
            .map(|vec| vec.len() > 0)
            .unwrap_or(false)
          || CEDICT_DATA
            .get_traditional(&ch.to_string())
            .map(|vec| vec.len() > 0)
            .unwrap_or(false))
    };

    if ch.is_ascii_whitespace() || is_chinese(&ch) {
      push_token(&ch.to_string());
      continue;
    }

    // Handle non-Chinese characters

    let mut word = String::new();

    word.push(ch);

    while let Some((_, next_ch)) = chars.peek() {
      if next_ch.is_ascii_whitespace() || is_chinese(next_ch) {
        break;
      }

      word.push(*next_ch);
      chars.next();
    }

    push_token(&word);
  }

  tokens
}

pub fn lookup_simplified(word: &str) -> Option<&'static Vec<WordEntry>> {
  CEDICT_DATA.get_simplified(word)
}

pub fn lookup_traditional(word: &str) -> Option<&'static Vec<WordEntry>> {
  CEDICT_DATA.get_traditional(word)
}

fn lookup_words_including_subslice(
  slice: &str,
  simplified: bool,
) -> Vec<&'static WordEntry> {
  let mut result = simplified
    .then(|| CEDICT_DATA.iter_simplified_prefix(""))
    .into_iter()
    .flatten()
    .chain(
      (!simplified)
        .then(|| CEDICT_DATA.iter_traditional_prefix(""))
        .into_iter()
        .flatten(),
    )
    .filter(|entry| {
      let word = if simplified {
        &entry.simplified
      } else {
        &entry.traditional
      };

      word != slice && word.contains(slice)
    })
    .collect::<Vec<_>>();

  result.sort_by_cached_key(|entry| {
    if simplified {
      &entry.simplified
    } else {
      &entry.traditional
    }
    .chars()
    .map(|ch| lookup_character(ch).map(|entry| entry.strokes))
    .sum::<Option<usize>>()
    .unwrap_or(usize::MAX)
  });
  result
}

pub fn lookup_simplified_including_subslice(
  slice: &str,
) -> Vec<&'static WordEntry> {
  lookup_words_including_subslice(slice, true)
}

pub fn lookup_traditional_with_subslice(
  slice: &str,
) -> Vec<&'static WordEntry> {
  lookup_words_including_subslice(slice, false)
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
  use crate::tokenize;

  #[test]
  fn should_tokenize_simple_sentence() {
    let tokens = tokenize("我是中国人。");

    assert_eq!(
      tokens.iter().map(|token| &token.value).collect::<Vec<_>>(),
      vec!["我", "是", "中国人", "。"]
    );
  }

  #[test]
  fn should_handle_non_chinese_characters_gracefully() {
    let tokens = tokenize("我的名字叫David。");

    assert_eq!(
      tokens.iter().map(|token| &token.value).collect::<Vec<_>>(),
      vec!["我", "的", "名字", "叫", "David", "。"]
    );
  }
}
