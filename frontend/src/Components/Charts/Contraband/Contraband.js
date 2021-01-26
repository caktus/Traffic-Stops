import React, { useState, useEffect } from 'react';
import * as S from './Contraband.styled';

import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import toTitleCase from 'util/toTitleCase';
import {
  RACES,
  YEARS_DEFAULT,
  reduceYearsToTotal,
  calculatePercentage,
  getQuantityForYear,
} from 'Components/Charts/chartUtils';

// State
import useDataset, { CONTRABAND_HIT_RATE } from 'Hooks/useDataset';

// Children
import { P } from 'styles/StyledComponents/Typography';
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import Bar from 'Components/Charts/ChartPrimitives/Bar';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';

function SearchRate() {
  let { agencyId } = useParams();
  const theme = useTheme();

  const [chartState] = useDataset(agencyId, CONTRABAND_HIT_RATE);

  const [availableYears, setAvailableYears] = useState();
  const [year, setYear] = useState(YEARS_DEFAULT);

  const [contrabandData, setContrabandData] = useState();

  useEffect(() => {
    const data = chartState.data[CONTRABAND_HIT_RATE];
    if (data) {
      const { contraband } = data;
      const years = contraband.map((s) => s.year);
      setAvailableYears(years);
    }
  }, [chartState.data[CONTRABAND_HIT_RATE]]);

  /* CALCULATE AND BUILD CHART DATA */
  // Build data for Contraband Hit Rate
  useEffect(() => {
    const data = chartState.data[CONTRABAND_HIT_RATE];
    if (data) {
      const { contraband, searches } = data;
      const mappedData = [];
      RACES.forEach((ethnicGroup) => {
        const groupBar = {};
        const displaName = toTitleCase(ethnicGroup);
        groupBar.displayName = displaName;
        groupBar.color = `${theme.colors.ethnicGroup[ethnicGroup]}90`;
        groupBar.x = displaName;
        if (year === YEARS_DEFAULT) {
          const groupContraband = reduceYearsToTotal(contraband, ethnicGroup)[ethnicGroup];
          const groupSearches = reduceYearsToTotal(searches, ethnicGroup)[ethnicGroup];
          groupBar.y = calculatePercentage(groupContraband, groupSearches);
        } else {
          const yearInt = parseInt(year);
          const groupContrabandForYear = getQuantityForYear(contraband, yearInt, ethnicGroup);
          const groupSearchesForYear = getQuantityForYear(searches, yearInt, ethnicGroup);
          groupBar.y = calculatePercentage(groupContrabandForYear, groupSearchesForYear);
        }
        mappedData.push(groupBar);
      });
      console.log('mappedData: ', mappedData);
      setContrabandData(mappedData.reverse());
    }
  }, [chartState.data[CONTRABAND_HIT_RATE], year]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  const handleViewData = () => {
    alert('view data');
  };

  const handleShareGraph = () => {
    alert('share graph');
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
          <S.LineSection>
            <S.LineWrapper>
              <Bar
                data={contrabandData}
                chartProps={{
                  domainPadding: { x: 20 },
                }}
                yAxisProps={{
                  tickValues: [0, 20, 40, 60, 80, 100],
                  tickFormat: (t) => `${t}%`,
                }}
                xAxisProps={{
                  tickFormat: (t) => {
                    if (t === 'Native American') {
                      return 'Native \n American';
                    } else return t;
                  },
                }}
                barProps={{
                  horizontal: true,
                  style: {
                    data: { fill: ({ datum }) => datum.color },
                    labels: { fontSize: 8 },
                  },
                  labels: ({ datum }) => `${datum.y}%`,
                  barWidth: 20,
                }}
              />
            </S.LineWrapper>
          </S.LineSection>
          <S.LegendSection>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelect}
              options={[YEARS_DEFAULT].concat(availableYears)}
            />
          </S.LegendSection>
        </S.ChartSubsection>
      </S.ChartSection>
    </S.Contraband>
  );
}

export default SearchRate;
