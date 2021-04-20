import range from 'lodash.range';

function useYearSet() {
  return [range(2002, new Date().getFullYear(), 1), range(2002, new Date().getFullYear(), 2)];
}

export default useYearSet;
