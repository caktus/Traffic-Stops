import React, { useEffect, useState } from 'react';
import ArrestsStyled from './Arrests.styles';

// Util
import { YEARS_DEFAULT } from '../chartUtils';

// Hooks
import useTableModal from '../../../Hooks/useTableModal';

// Children
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import PercentageOfStops from './Charts/PercentageOfStops';
import useYearSet from '../../../Hooks/useYearSet';
import PercentageOfSearches from './Charts/PercentageOfSearches';
import CountOfStopsAndArrests from './Charts/CountOfStopsAndArrests';
import PercentageOfStopsForStopPurposeGroup from './Charts/PercentageOfStopsForPurposeGroup';
import PercentageOfStopsForStopPurpose from './Charts/PercentageOfStopsPerStopPurpose';
import PercentageOfSearchesForStopPurposeGroup from './Charts/PercentageOfSearchesForPurposeGroup';
import PercentageOfSearchesPerStopPurpose from './Charts/PercentageOfSearchesPerStopPurpose';
import PercentageOfStopsPerContrabandType from './Charts/PercentageOfStopsPerContrabandType';
import Switch from 'react-switch';
import { SwitchContainer } from '../TrafficStops/TrafficStops.styled';

function Arrests(props) {
  const [year, setYear] = useState(YEARS_DEFAULT);
  const [yearRange] = useYearSet();
  const [togglePercentageOfStops, setTogglePercentageOfStops] = useState(true);
  const [togglePercentageOfSearches, setTogglePercentageOfSearches] = useState(true);

  const [renderTableModal] = useTableModal();

  useEffect(() => {
    if (window.location.hash) {
      document.querySelector(`${window.location.hash}`).scrollIntoView();
    }
  }, []);

  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  return (
    <ArrestsStyled>
      {renderTableModal()}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <DataSubsetPicker
          label="Year"
          value={year}
          onChange={handleYearSelect}
          options={[YEARS_DEFAULT].concat(yearRange)}
          dropDown
        />
      </div>
      <PercentageOfStops {...props} year={year} />
      <PercentageOfSearches {...props} year={year} />
      <CountOfStopsAndArrests {...props} year={year} />

      <SwitchContainer>
        <span>
          Switch to view {togglePercentageOfStops ? 'all stop purposes' : 'grouped stop purposes '}
        </span>
        <Switch
          onChange={() => setTogglePercentageOfStops(!togglePercentageOfStops)}
          checked={togglePercentageOfStops}
          className="react-switch"
        />
      </SwitchContainer>
      {togglePercentageOfStops ? (
        <PercentageOfStopsForStopPurposeGroup {...props} year={year} />
      ) : (
        <PercentageOfStopsForStopPurpose {...props} year={year} />
      )}

      <SwitchContainer>
        <span>
          Switch to view{' '}
          {togglePercentageOfSearches ? 'all stop purposes' : 'grouped stop purposes '}
        </span>
        <Switch
          onChange={() => setTogglePercentageOfSearches(!togglePercentageOfSearches)}
          checked={togglePercentageOfSearches}
          className="react-switch"
        />
      </SwitchContainer>

      {togglePercentageOfSearches ? (
        <PercentageOfSearchesForStopPurposeGroup {...props} year={year} />
      ) : (
        <PercentageOfSearchesPerStopPurpose {...props} year={year} />
      )}

      <PercentageOfStopsPerContrabandType {...props} year={year} />
    </ArrestsStyled>
  );
}

export default Arrests;

export const ARRESTS_TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year', // accessor is the "key" in the data
  },
  {
    Header: 'White*',
    accessor: 'white',
  },
  {
    Header: 'Black*',
    accessor: 'black',
  },
  {
    Header: 'Native American*',
    accessor: 'native_american',
  },
  {
    Header: 'Asian*',
    accessor: 'asian',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
  {
    Header: 'Total',
    accessor: 'total',
  },
];
