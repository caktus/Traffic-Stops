import React, { useState, useEffect } from 'react';
import * as S from './UseOfForce.styled';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import {
  YEARS_DEFAULT,
  STATIC_LEGEND_KEYS,
  RACES,
  reduceFullDataset,
  calculatePercentage,
  calculateYearTotal,
} from 'Components/Charts/chartUtils';

// State
import useDataset, { USE_OF_FORCE } from 'Hooks/useDataset';

// Children
import { P } from 'styles/StyledComponents/Typography';
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import Legend from 'Components/Charts/ChartSections/Legend/Legend';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';
import GroupedBar from 'Components/Charts/ChartPrimitives/GroupedBar';
import Pie from 'Components/Charts/ChartPrimitives/Pie';
import toTitleCase from 'util/toTitleCase';

function UseOfForce() {
  let { agencyId } = useParams();
  const theme = useTheme();

  const [chartState] = useDataset(agencyId, USE_OF_FORCE);

  const [availableYears, setAvailableYears] = useState();
  const [year, setYear] = useState(YEARS_DEFAULT);

  const [ethnicGroupKeys, setEthnicGroupKeys] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [useOfForceData, setUseOfForceData] = useState([]);
  const [useOfForcePieData, setUseOfForcePieData] = useState([]);

  /* SET INITIAL STATE */
  // First, find out which years are available by
  // inspecting one of the datasets
  useEffect(() => {
    const data = chartState.data[USE_OF_FORCE];
    if (data) {
      const years = data.map((s) => s.year);
      setAvailableYears(years);
    }
  }, [chartState.data[USE_OF_FORCE]]);

  /* BUILD DATA */
  // Bar chart data
  useEffect(() => {
    const data = chartState.data[USE_OF_FORCE];
    if (data) {
      const mappedData = ethnicGroupKeys
        .filter((e) => e.selected)
        .map((eg) => {
          const ethnicGroup = eg.value;
          return {
            id: ethnicGroup,
            color: theme.colors.ethnicGroup[ethnicGroup],
            data: data.map((d) => ({
              x: d.year,
              y: d[ethnicGroup],
            })),
          };
        });
      setUseOfForceData(mappedData);
    }
  }, [chartState.data[USE_OF_FORCE], ethnicGroupKeys]);

  // Pie chart data
  useEffect(() => {
    const data = chartState.data[USE_OF_FORCE];
    if (data) {
      if (!year || year === YEARS_DEFAULT) {
        setUseOfForcePieData(reduceFullDataset(data, RACES, theme));
      } else {
        const yearData = data.find((d) => d.year === year);
        const total = calculateYearTotal(yearData);
        setUseOfForcePieData(
          RACES.map((race) => ({
            x: toTitleCase(race),
            y: calculatePercentage(yearData[race], total),
            color: theme.colors.ethnicGroup[race],
            fontColor: theme.colors.fontColorsByEthnicGroup[race],
          }))
        );
      }
    }
  }, [chartState.data[USE_OF_FORCE], year]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelected = (y) => {
    if (y === year) return;
    setYear(y);
  };
  // Handle stops by percentage legend interactions
  const handleGroupKeySelected = (ethnicGroup) => {
    const groupIndex = ethnicGroupKeys.indexOf(
      ethnicGroupKeys.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...ethnicGroupKeys];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setEthnicGroupKeys(updatedGroups);
  };
  const handleViewData = () => {
    alert('view data');
  };

  const handleShareGraph = () => {
    alert('share graph');
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
            <S.LineWrapper>
              <GroupedBar
                data={useOfForceData}
                iTickFormat={(t) => (t % 2 === 0 ? t : null)}
                iTickValues={availableYears}
                loading={chartState.loading[USE_OF_FORCE]}
              />
            </S.LineWrapper>
            <S.LegendBelow>
              <Legend
                heading="Show on graph:"
                keys={ethnicGroupKeys}
                onKeySelect={handleGroupKeySelected}
                showNonHispanic
                row
              />
            </S.LegendBelow>
          </S.LineSection>
          <S.PieSection>
            <S.PieWrapper>
              <Pie data={useOfForcePieData} loading={chartState.loading[USE_OF_FORCE]} />
            </S.PieWrapper>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelected}
              options={availableYears}
              dropUp
            />
          </S.PieSection>
        </S.ChartSubsection>
      </S.ChartSection>
    </S.UseOfForce>
  );
}

export default UseOfForce;
