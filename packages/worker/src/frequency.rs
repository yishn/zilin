use std::sync::Arc;

use rustc_hash::FxHashMap as HashMap;

#[derive(Debug, Clone)]
pub struct FrequencyDictionary {
  data: HashMap<Arc<str>, f32>,
  max_log_frequency: f32,
}

impl FrequencyDictionary {
  pub fn new(data: &str) -> Self {
    let mut max = 0.0_f32;
    let mut map =
      HashMap::with_capacity_and_hasher(131_072, Default::default());

    for line in data.lines().skip(3) {
      let mut tokens = line.split_ascii_whitespace();

      if let (Some(word), _, _, Some(log_frequency)) = (
        tokens.next(),
        tokens.next(),
        tokens.next(),
        tokens.next().and_then(|token| token.parse().ok()),
      ) {
        map.insert(Arc::from(word), log_frequency);
        max = max.max(log_frequency);
      }
    }

    Self {
      data: map,
      max_log_frequency: max,
    }
  }

  pub fn get(&self, word: &str) -> u8 {
    self
      .data
      .get(word)
      .copied()
      .or_else(|| {
        word
          .chars()
          .filter_map(|ch| self.data.get(&*ch.to_string()))
          .copied()
          .min_by(|x, y| x.partial_cmp(y).unwrap_or(std::cmp::Ordering::Equal))
      })
      .map(|log_frequency| log_frequency * 100.0 / self.max_log_frequency)
      .map(|x| x.clamp(0.0, 100.0) as u8)
      .unwrap_or(0)
  }
}

#[cfg(test)]
mod tests {
  use once_cell::sync::Lazy;

  use super::FrequencyDictionary;

  static FREQUENCY_DATA: Lazy<FrequencyDictionary> = Lazy::new(|| {
    FrequencyDictionary::new(include_str!("../../../data/SUBTLEX-CH-WF.txt"))
  });

  #[test]
  fn should_be_able_to_parse_dictionary_data() {
    let _ = &*FREQUENCY_DATA;
  }
}
