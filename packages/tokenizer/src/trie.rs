use std::{collections::HashMap, iter::Peekable};

#[derive(Debug, Clone)]
pub struct Trie<T> {
  data: HashMap<char, (Option<T>, Box<Trie<T>>)>,
}

impl<T> Default for Trie<T> {
  fn default() -> Self {
    Self::new()
  }
}

impl<T> Trie<T> {
  pub fn new() -> Self {
    Self {
      data: HashMap::new(),
    }
  }

  pub fn with_capacity(capacity: usize) -> Self {
    Self {
      data: HashMap::with_capacity(capacity),
    }
  }

  fn entry<I>(
    &self,
    mut chars: Peekable<I>,
  ) -> Option<&(Option<T>, Box<Trie<T>>)>
  where
    I: Iterator<Item = char>,
  {
    let next_char = chars.next();

    if let Some(ch) = next_char {
      let entry = self.data.get(&ch);

      if chars.peek().is_none() {
        entry
      } else {
        entry.and_then(|entry| entry.1.entry(chars))
      }
    } else {
      None
    }
  }

  fn entry_mut<I>(
    &mut self,
    mut chars: Peekable<I>,
  ) -> Option<&mut (Option<T>, Box<Trie<T>>)>
  where
    I: Iterator<Item = char>,
  {
    let next_char = chars.next();

    if let Some(ch) = next_char {
      let entry = self.data.entry(ch).or_default();

      if chars.peek().is_none() {
        Some(entry)
      } else {
        entry.1.entry_mut(chars)
      }
    } else {
      None
    }
  }

  pub fn get(&self, key: &str) -> Option<&T> {
    self
      .entry(key.chars().peekable())
      .and_then(|(value, _)| value.as_ref())
  }

  pub fn get_mut(&mut self, key: &str) -> Option<&mut T> {
    self
      .entry_mut(key.chars().peekable())
      .and_then(|(value, _)| value.as_mut())
  }

  pub fn get_mut_or_insert_default(&mut self, key: &str) -> Option<&mut T>
  where
    T: Default,
  {
    self
      .entry_mut(key.chars().peekable())
      .and_then(|(value, _)| {
        if value.is_none() {
          *value = Some(T::default());
        }

        value.as_mut()
      })
  }

  pub fn get_prefix<'a>(
    &'a self,
    key: &str,
  ) -> Box<dyn Iterator<Item = &'a T> + 'a> {
    let mut chars = key.chars().peekable();

    if chars.peek().is_none() {
      // Return all entries

      return Box::new(self.data.values().flat_map(|entry| {
        entry.0.as_ref().into_iter().chain(entry.1.get_prefix(""))
      }));
    }

    let entry = self.entry(chars);

    if let Some(entry) = entry {
      Box::new(entry.0.as_ref().into_iter().chain(entry.1.get_prefix("")))
    } else {
      Box::new(None.into_iter())
    }
  }

  pub fn push(&mut self, key: &str, value: T) {
    let entry = self.entry_mut(key.chars().peekable());

    if let Some((value_opt, _)) = entry {
      *value_opt = Some(value);
    }
  }
}
