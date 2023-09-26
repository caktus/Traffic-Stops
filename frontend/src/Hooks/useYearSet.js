import range from 'lodash.range';

function useYearSet() {
  // Add 1 more year to include in range.
  const currentYear = new Date().getFullYear() + 1;
  return [range(2002, currentYear, 1).reverse(), range(2002, currentYear, 2).reverse()];
}

export default useYearSet;
