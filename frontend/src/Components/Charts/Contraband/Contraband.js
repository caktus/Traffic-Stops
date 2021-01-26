import React, { useState, useEffect } from 'react';
import * as S from './Contraband.styled';

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
    <S.Contraband>
      <S.ChartSection>
        <ChartHeader
          chartTitle='Contraband "Hit Rate"'
          handleViewData={handleViewData}
          handleShareGraph={handleShareGraph}
        />
        <P>
          Shows what percentage of searches discovered contraband for a given race / ethnic group
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
    </S.Contraband>
  );
}

export default SearchRate;
