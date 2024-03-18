import React, { useEffect, useState } from 'react';
import ArrestsStyled from './Arrests.styles';

// Util
import { YEARS_DEFAULT } from '../chartUtils';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Children
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import ArrestsByPercentage from './Charts/ArrestsByPercentage';
import useYearSet from '../../../Hooks/useYearSet';

function Arrests(props) {
  const [year, setYear] = useState(YEARS_DEFAULT);
  const [yearRange] = useYearSet();

  const renderMetaTags = useMetaTags();
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
      {renderMetaTags()}
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
      <ArrestsByPercentage {...props} year={year} />
    </ArrestsStyled>
  );
}

export default Arrests;
