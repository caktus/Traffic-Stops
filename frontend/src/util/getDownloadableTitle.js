export default function getDownloadableTitle(title) {
  return `${title.split(' ').join('_').toLowerCase()}.png`;
}
