import React, { useState, useEffect } from 'react';
import * as S from './TrafficStops.styled';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import {
  reduceFullDataset,
  calculatePercentage,
  calculateYearTotal,
  getAvailableReasons,
  filterSinglePurpose,
  buildStackedBarData,
  STATIC_LEGEND_KEYS,
  YEARS_DEFAULT,
  PURPOSE_DEFAULT,
  RACES,
} from 'Components/Charts/chartUtils';

// State
import useDataset, { STOPS_BY_REASON, STOPS } from 'Hooks/useDataset';

// Elements
import { P } from 'styles/StyledComponents/Typography';

// Children
import Line from 'Components/Charts/ChartPrimitives/Line';
import StackedBar from 'Components/Charts/ChartPrimitives/StackedBar';
import Pie from 'Components/Charts/ChartPrimitives/Pie';
import Legend from 'Components/Charts/ChartSections/Legend/Legend';
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';
import toTitleCase from 'util/toTitleCase';

function TrafficStops() {
  let { agencyId } = useParams();
  const theme = useTheme();

  useDataset(agencyId, STOPS_BY_REASON);
  const [chartState] = useDataset(agencyId, STOPS);

  const [availableYears, setAvailableYears] = useState();
  const [year, setYear] = useState(YEARS_DEFAULT);

  const [availablePurposes, setAvailablePurposes] = useState();
  const [purpose, setPurpose] = useState(PURPOSE_DEFAULT);

  const [percentageEthnicGroups, setPercentageEthnicGroups] = useState(
    /* I sure wish I understood with certainty why this is necessary. Here's what I know:
      - Setting both of these states to STATIC_LEGEND_KEYS cause calling either setState function
      to mutate both states.
      - If I set initial state to STATIC_LEGEND_KEYS.slice() or [...STATIC_LEGEND_KEYS],
      the problem remains.
      - Indeed, if I set it to STATIC_LEGEND_KEYS.map(k => k), it persists.
      - Only when I make a copy of the objects inside the list do the states update
      independently.
      Conslusion is that React must make shallow copies of initalState, leaving pointers
      to deeper variables in tact. The result here is that, while we may have separate 
      instances of STATIC_LEGEND_KEYS in state, the pointers to the keys in its objects
      are the same-- updating one state updates the other.
    */
    () => STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );
  const [countEthnicGroups, setCountEthnicGroups] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [byPercentageLineData, setByPercentageLineData] = useState([]);
  const [byPercentagePieData, setByPercentagePieData] = useState([]);

  const [byCountLineData, setByCountLineData] = useState([]);

  /* SET INITIAL STATE */
  // First, find out which years are available by
  // inspecting one of the datasets
  useEffect(() => {
    const stops = chartState.data[STOPS];
    if (stops) {
      const uniqueYears = stops.map((s) => parseInt(s.year, 10));
      setAvailableYears(uniqueYears);
    }
  }, [chartState.data[STOPS]]);

  useEffect(() => {
    const stops = chartState.data[STOPS_BY_REASON]?.stops;
    if (stops) {
      const stopReasons = getAvailableReasons(stops, 'purpose');
      setAvailablePurposes(stopReasons);
    }
  }, [chartState.data[STOPS_BY_REASON]]);

  /* CALCULATE AND BUILD CHART DATA */

  // Build data for Stops by Percentage line chart
  useEffect(() => {
    const data = chartState.data[STOPS];
    if (data) {
      const filteredGroups = percentageEthnicGroups.filter((g) => g.selected).map((g) => g.value);
      const derivedData = buildStackedBarData(data, filteredGroups, theme);
      setByPercentageLineData(derivedData);
    }
  }, [chartState.data[STOPS], percentageEthnicGroups]);

  // Build data for Stops by Percentage pie chart
  useEffect(() => {
    const data = chartState.data[STOPS];
    if (data) {
      if (!year || year === 'All') {
        setByPercentagePieData(reduceFullDataset(data, RACES, theme));
      } else {
        const yearData = data.find((d) => d.year === year);
        const total = calculateYearTotal(yearData);
        setByPercentagePieData(
          RACES.map((race) => ({
            x: toTitleCase(race),
            y: calculatePercentage(yearData[race], total),
            color: theme.colors.ethnicGroup[race],
            fontColor: theme.colors.fontColorsByEthnicGroup[race],
          }))
        );
      }
    }
  }, [chartState.data[STOPS], year]);

  // Build data for Stops By Count line chart ("All")
  useEffect(() => {
    const data = chartState.data[STOPS];
    if (data && purpose === PURPOSE_DEFAULT) {
      const derivedData = countEthnicGroups
        .filter((g) => g.selected)
        .map((r) => {
          const race = r.value;
          const rGroup = {
            id: race,
            color: theme.colors.ethnicGroup[race],
          };
          rGroup.data = data.map((d) => ({
            displayName: toTitleCase(race),
            x: d.year,
            y: d[race],
          }));
          return rGroup;
        });
      setByCountLineData(derivedData);
    }
  }, [chartState.data[STOPS], purpose, countEthnicGroups]);

  // Build data for Stops By Count line chart (single purpose)
  useEffect(() => {
    const data = chartState.data[STOPS_BY_REASON]?.stops;
    if (data && purpose !== PURPOSE_DEFAULT) {
      const purposeData = filterSinglePurpose(data, purpose);
      const derivedData = countEthnicGroups
        .filter((g) => g.selected)
        .map((r) => {
          const race = r.value;
          return {
            id: race,
            color: theme.colors.ethnicGroup[race],
            data: purposeData.map((d) => ({
              displayName: toTitleCase(race),
              x: d.year,
              y: d[race],
            })),
          };
        });
      setByCountLineData(derivedData);
    }
  }, [chartState.data[STOPS_BY_REASON], purpose, countEthnicGroups]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  // Handle stop purpose dropdown state
  const handleStopPurposeSelect = (p) => {
    if (p === purpose) return;
    setPurpose(p);
  };

  // Handle stops by percentage legend interactions
  const handlePercentageKeySelected = (ethnicGroup) => {
    console.log('------> changing PERCENTAGE ethnic group keys');
    const groupIndex = percentageEthnicGroups.indexOf(
      percentageEthnicGroups.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...percentageEthnicGroups];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setPercentageEthnicGroups(updatedGroups);
  };

  // Handle stops by count legend interactions
  const handleCountKeySelected = (ethnicGroup) => {
    console.log('------> changing COUNT ethnic group keys');
    const groupIndex = countEthnicGroups.indexOf(
      countEthnicGroups.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...countEthnicGroups];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setCountEthnicGroups(updatedGroups);
  };

  const handleViewPercentageData = () => {};
  const handleSharePercentageGraph = () => {};
  const handleViewCountData = () => {};
  const handleShareCountGraph = () => {};

  console.log('percentageEthnicGroups', percentageEthnicGroups);
  console.log('countEthnicGroups', countEthnicGroups);
  return (
    <S.TrafficStops>
      {/* Traffic Stops by Percentage */}
      <S.ChartSection>
        <ChartHeader
          chartTitle="Traffic Stops By Percentage"
          handleViewData={handleViewPercentageData}
          handleShareGraph={handleSharePercentageGraph}
        />
        <P>Shows the race/ethnic composition of drivers stopped by this department over time.</P>
        <S.ChartSubsection>
          <S.LineSection>
            <S.LineWrapper>
              <StackedBar
                horizontal
                data={byPercentageLineData}
                tickValues={availableYears}
                loading={chartState.loading[STOPS]}
              />
            </S.LineWrapper>
            <S.LegendBelow>
              <Legend
                heading="Show on graph:"
                keys={percentageEthnicGroups}
                onKeySelect={handlePercentageKeySelected}
                showNonHispanic
                row
              />
            </S.LegendBelow>
          </S.LineSection>
          <S.PieSection>
            <S.PieWrapper>
              <Pie data={byPercentagePieData} loading={chartState.loading[STOPS]} />
            </S.PieWrapper>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelect}
              options={[YEARS_DEFAULT].concat(availableYears)}
            />
          </S.PieSection>
        </S.ChartSubsection>
      </S.ChartSection>
      {/* Traffic Stops by Count */}
      <S.ChartSection>
        <ChartHeader
          chartTitle="Traffic Stops By Count"
          handleViewData={handleViewCountData}
          handleShareGraph={handleShareCountGraph}
        />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>
        <S.ChartSubsection>
          <S.LineWrapper>
            <Line
              data={byCountLineData}
              loading={chartState.loading[STOPS_BY_REASON]}
              iTickFormat={(t) => (t % 2 === 0 ? t : null)}
              iTickValues={availableYears}
            />
          </S.LineWrapper>
          <S.LegendBeside>
            <DataSubsetPicker
              label="Stop Purpose"
              value={purpose}
              onChange={handleStopPurposeSelect}
              options={[PURPOSE_DEFAULT].concat(availablePurposes)}
            />
            <S.Spacing>
              <Legend
                heading="Show on graph:"
                keys={countEthnicGroups}
                onKeySelect={handleCountKeySelected}
                showNonHispanic
              />
            </S.Spacing>
          </S.LegendBeside>
        </S.ChartSubsection>
      </S.ChartSection>
    </S.TrafficStops>
  );
}

export default TrafficStops;