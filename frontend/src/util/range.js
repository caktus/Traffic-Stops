export default (start, end, step = 1) => {
  const len = Math.floor((end - start) / step) + 1;
  return Array(len)
    .fill()
    .map((_, idx) => start + idx * step);
};

export function getRangeValues(fromBeginning = false) {
  const today = new Date();
  const fromDate = new Date(today);
  const toDate = new Date(today);

  if (fromBeginning) {
    fromDate.setFullYear(2000, 1, 1);
  }

  return {
    from: {
      year: fromDate.getFullYear(),
      month: fromDate.getMonth() + 1,
    },
    to: {
      year: toDate.getFullYear(),
      month: toDate.getMonth() + 1,
    },
  };
}
