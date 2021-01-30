import React, { useState, useEffect } from 'react';
import * as S from './SearchRate.styled';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Data
import useDataset, { STOPS_BY_REASON } from 'Hooks/useDataset';

// Constants
import {
  STATIC_LEGEND_KEYS,
  YEARS_DEFAULT,
  filterSinglePurpose,
  getAvailableReasons,
  getGroupValueBasedOnYear,
  getRatesAgainstBase,
} from '../chartUtils';

// Children
import { P } from 'styles/StyledComponents/Typography';
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import Legend from 'Components/Charts/ChartSections/Legend/Legend';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';
import GroupedBar from '../ChartPrimitives/GroupedBar';
import { VictoryLabel } from 'victory';

function SearchRate() {
  let { agencyId } = useParams();
  const theme = useTheme();

  const [chartState] = useDataset(agencyId, STOPS_BY_REASON);

  const [availableYears, setAvailableYears] = useState([]);
  const [year, setYear] = useState(YEARS_DEFAULT);
  const [ethnicGroupKeys, setEthnicGroupKeys] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [chartData, setChartData] = useState([]);

  /* Set initial data */
  useEffect(() => {
    const data = chartState.data[STOPS_BY_REASON];
    if (data) {
      const purposeYears = filterSinglePurpose(data.stops, 'Driving While Impaired');
      const years = purposeYears.map((p) => p.year);
      setAvailableYears([YEARS_DEFAULT].concat(years));
    }
  }, [chartState.data[STOPS_BY_REASON]]);

  /* BUILD DATA */
  useEffect(() => {
    const data = chartState.data[STOPS_BY_REASON];
    if (data) {
      const availableStopReasons = getAvailableReasons(data.stops, 'purpose');
      const baseGroupTotalSearches = getGroupValueBasedOnYear(
        data.searches,
        'white',
        year,
        availableStopReasons
      );
      const baseGroupTotalStops = getGroupValueBasedOnYear(
        data.stops,
        'white',
        year,
        availableStopReasons
      );
      const mappedData = ethnicGroupKeys
        .filter((g) => g.selected && g.value !== 'white')
        .map((g) => {
          const ethnicGroup = g.value;
          const groupTotalSearches = getGroupValueBasedOnYear(
            data.searches,
            ethnicGroup,
            year,
            availableStopReasons
          );
          const groupTotalStops = getGroupValueBasedOnYear(
            data.stops,
            ethnicGroup,
            year,
            availableStopReasons
          );
          const ratesByReason = getRatesAgainstBase(
            baseGroupTotalSearches,
            baseGroupTotalStops,
            groupTotalSearches,
            groupTotalStops
          );
          return {
            id: ethnicGroup,
            color: `${theme.colors.ethnicGroup[ethnicGroup]}90`,
            data: availableStopReasons.map((reason) => ({
              x: reason,
              y: ratesByReason[reason],
            })),
          };
        });
      setChartData(mappedData);
    }
  }, [chartState.data[STOPS_BY_REASON], ethnicGroupKeys, year]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelected = (y) => {
    if (y === year) return;
    setYear(y);
  };

  // Legend interaction
  const handleGroupKeySelected = (ethnicGroup) => {
    const groupIndex = ethnicGroupKeys.indexOf(
      ethnicGroupKeys.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...ethnicGroupKeys];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setEthnicGroupKeys(updatedGroups);
  };

  const handleViewData = () => {};
  const handleShareGraph = () => {};

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
          <S.LineWrapper>
            <GroupedBar
              data={chartData}
              loading={chartState.loading[STOPS_BY_REASON]}
              horizontal
              iAxisProps={{
                tickLabelComponent: <VictoryLabel x={100} dx={-50} style={{ fontSize: 6 }} />,
                tickFormat: (t) => (t.split ? t.split(' ') : t),
              }}
              chartProps={{
                height: 500,
                width: 400,
              }}
              barProps={{
                barWidth: 10,
              }}
            />
          </S.LineWrapper>
          <S.LegendBelow>
            <S.Spacing>
              <Legend
                heading="Show on graph:"
                keys={ethnicGroupKeys}
                onKeySelect={handleGroupKeySelected}
                showNonHispanic
              />
              <DataSubsetPicker
                label="Year"
                value={year}
                onChange={handleYearSelected}
                options={availableYears}
              />
            </S.Spacing>
          </S.LegendBelow>
        </S.ChartSubsection>
      </S.ChartSection>
    </S.SearchRate>
  );
}

export default SearchRate;
