import React, { useState, useEffect } from 'react';
import * as S from './UseOfForce.styled';

// Children
import { P } from 'styles/StyledComponents/Typography';
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import Legend from 'Components/Charts/ChartSections/Legend/Legend';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';

function UseOfForce() {
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
    <S.UseOfForce>
      <S.ChartSection>
        <ChartHeader
          chartTitle="Use of Force"
          handleViewData={handleViewData}
          handleShareGraph={handleShareGraph}
        />
        <P>
          Shows the race/ethnic composition of drivers whom law enforcement officers reported using
          force against
        </P>
        <S.ChartSubsection>
          <S.LineSection>
            <S.LineWrapper>Chart goes here.</S.LineWrapper>
            <S.LegendBelow>
              <Legend
                heading="Show on graph:"
                keys={ethnicGroupKeys}
                onKeySelect={handleKeySelected}
                showNonHispanic
                row
              />
            </S.LegendBelow>
          </S.LineSection>
          <S.PieSection>
            <S.PieWrapper>
              {/* <Pie data={byPercentagePieData} loading={chartState.loading[STOPS]} /> */}
              Pie goes here
            </S.PieWrapper>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelected}
              options={[]}
            />
          </S.PieSection>
        </S.ChartSubsection>
      </S.ChartSection>
    </S.UseOfForce>
  );
}

export default UseOfForce;
