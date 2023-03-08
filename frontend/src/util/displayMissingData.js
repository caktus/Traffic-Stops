export default function displayMissingPhrase(ds) {
  let phrase = {
    STOPS: 'stops have',
    SEARCHES: 'searches have',
    STOPS_BY_REASON: 'stops have',
    SEARCHES_BY_TYPE: 'searches have',
    USE_OF_FORCE: 'use of force has',
    CONTRABAND_HIT_RATE: 'contraband has',
    LIKELIHOOD_OF_SEARCH: 'searches have',
  }[ds];
  if (phrase === undefined && Array.isArray(ds)) {
    phrase = 'searches have';
  }
  if (!phrase) {
    phrase = 'data has';
  }
  return `No ${phrase} been reported`;
}
