import React, { useState, useEffect } from 'react';
import * as S from './SearchRate.styled';

// Children
import { P } from 'styles/StyledComponents/Typography';
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import Legend from 'Components/Charts/ChartSections/Legend/Legend';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';

function SearchRate() {
  const [year, setYear] = useState();
  const [ethnicGroupKeys, setEthnicGroupKeys] = useState([]);

  const handleViewData = () => {
    alert('view data');
  };

  const handleShareGraph = () => {
    alert('share graph');
  };

  const handleKeySelected = (eg) => {
    console.log('ethnic group: ', eg);
  };

  const handleYearSelected = (y) => {
    console.log('year: ', y);
  };

  return (
    <S.SearchRate>
      <S.ChartSection>
        <ChartHeader
          chartTitle="Likelihood of Search"
          handleViewData={handleViewData}
          handleShareGraph={handleShareGraph}
        />
        <P>
          Shows the likelihood that drivers of a particular race / ethnicity are searched compared
          to white drivers, based on stop cause. Stops done for “safety” purposes may be less likely
          to show racial bias than stops done for “investigatory” purposes.
        </P>
        <P>
          <strong>NOTE:</strong> Large or unexpected percentages may be based on a low number of
          incidents. Use “View Data” to see the numbers underlying the calculations.
        </P>
        <S.ChartSubsection>
          <S.LineWrapper>Line graph goes here.</S.LineWrapper>
          <S.LegendBelow>
            <S.Spacing>
              <Legend
                heading="Show on graph:"
                keys={ethnicGroupKeys}
                onKeySelect={handleKeySelected}
                showNonHispanic
              />
              <DataSubsetPicker
                label="Year"
                value={year}
                onChange={handleYearSelected}
                options={[]}
              />
            </S.Spacing>
          </S.LegendBelow>
        </S.ChartSubsection>
      </S.ChartSection>
    </S.SearchRate>
  );
}

export default SearchRate;
