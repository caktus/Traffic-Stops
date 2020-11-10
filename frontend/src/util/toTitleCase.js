export default function toTitleCase(str) {
  return str.toLowerCase().split(/[\s_ ]+/).map(function(word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}