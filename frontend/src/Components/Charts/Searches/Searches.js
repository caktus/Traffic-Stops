import React, { useState, useEffect } from 'react';
import * as S from './Searches.styled';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import {
  getSearchRateForYearByGroup,
  filterDataBySearchType,
  reduceStopReasonsByEthnicity,
  STATIC_LEGEND_KEYS,
  SEARCH_TYPE_DEFAULT,
  AVERAGE,
  SEARCH_TYPES,
} from 'Components/Charts/chartUtils';

// State
import useDataset, { SEARCHES, STOPS, SEARCHES_BY_TYPE } from 'Hooks/useDataset';

// Hooks
import useMetaTags from 'Hooks/useMetaTags';

// Elements
import { P } from 'styles/StyledComponents/Typography';

// Children
import Line from 'Components/Charts/ChartPrimitives/Line';
import Legend from 'Components/Charts/ChartSections/Legend/Legend';
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';

function Searches() {
  let { agencyId } = useParams();
  const theme = useTheme();

  useDataset(agencyId, STOPS);
  useDataset(agencyId, SEARCHES);
  const [chartState] = useDataset(agencyId, SEARCHES_BY_TYPE);

  const [searchType, setSearchType] = useState(SEARCH_TYPE_DEFAULT);

  const [percentageEthnicGroups, setPercentageEthnicGroups] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k })).concat([AVERAGE])
  );
  const [countEthnicGroups, setCountEthnicGroups] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [byPercentageLineData, setByPercentageLineData] = useState();

  const [byCountLineData, setByCountLineData] = useState();

  const renderMetaTags = useMetaTags();

  /* CALCULATE AND BUILD CHART DATA */
  // Build data for Searches by Percentage
  useEffect(() => {
    const stops = chartState.data[STOPS];
    const searches = chartState.data[SEARCHES];
    if (searches && stops) {
      const mappedData = [];
      percentageEthnicGroups
        .filter((g) => g.selected)
        .forEach((eg) => {
          const ethnicGroup = eg.value;
          const groupData = {};
          groupData.id = ethnicGroup;
          groupData.color = theme.colors.ethnicGroup[ethnicGroup];
          groupData.data = chartState.yearRange.map((year) => {
            const tick = {};
            tick.x = year;
            tick.y = getSearchRateForYearByGroup(
              searches,
              stops,
              year,
              ethnicGroup,
              percentageEthnicGroups
            );
            tick.displayName = eg.label;
            return tick;
          });
          mappedData.push(groupData);
        });
      setByPercentageLineData(mappedData);
    }
  }, [
    chartState.data[STOPS],
    chartState.data[SEARCHES],
    percentageEthnicGroups,
    chartState.yearRange,
  ]);

  // Calculate search counts
  useEffect(() => {
    const data = chartState.data[SEARCHES_BY_TYPE];
    if (data && chartState.yearRange?.length > 0) {
      const mappedData = [];
      const ethnicGroups = countEthnicGroups.filter((g) => g.selected).map((g) => g.value);
      const dataBySearchReason = filterDataBySearchType(data, searchType);
      ethnicGroups.forEach((ethnicGroup) => {
        const group = {};
        group.id = ethnicGroup;
        group.color = theme.colors.ethnicGroup[ethnicGroup];
        const groupData = reduceStopReasonsByEthnicity(
          dataBySearchReason,
          chartState.yearRange,
          ethnicGroup,
          searchType
        );
        group.data = groupData;
        mappedData.push(group);
      });
      setByCountLineData(mappedData);
    }
  }, [chartState.data[SEARCHES_BY_TYPE], chartState.yearRange, countEthnicGroups, searchType]);

  /* INTERACTIONS */
  // Handle search type dropdown state
  const handleStopPurposeSelect = (s) => {
    if (s === searchType) return;
    setSearchType(s);
  };

  // Handle stops by percentage legend interactions
  const handlePercentageKeySelected = (ethnicGroup) => {
    const groupIndex = percentageEthnicGroups.indexOf(
      percentageEthnicGroups.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...percentageEthnicGroups];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setPercentageEthnicGroups(updatedGroups);
  };

  // Handle stops by count legend interactions
  const handleCountKeySelected = (ethnicGroup) => {
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

  return (
    <S.Searches>
      {/* Searche Rate */}
      {renderMetaTags()}
      <S.ChartSection>
        <ChartHeader
          chartTitle="Searches by Percentage"
          handleViewData={handleViewPercentageData}
          handleShareGraph={handleSharePercentageGraph}
        />
        <P>Shows the percent of stops that led to searches, broken down by race/ethnicity.</P>
        <S.ChartSubsection>
          <S.LineWrapper>
            <Line
              data={byPercentageLineData}
              loading={chartState.loading[SEARCHES]}
              iTickFormat={(t) => (t % 2 === 0 ? t : null)}
              iTickValues={chartState.yearSet}
            />
          </S.LineWrapper>
          <S.LegendBeside>
            <S.Spacing>
              <Legend
                heading="Show on graph:"
                keys={percentageEthnicGroups}
                onKeySelect={handlePercentageKeySelected}
                showNonHispanic
              />
            </S.Spacing>
          </S.LegendBeside>
        </S.ChartSubsection>
      </S.ChartSection>
      {/* Searches by Count */}
      <S.ChartSection>
        <ChartHeader
          chartTitle="Searches By Count"
          handleViewData={handleViewCountData}
          handleShareGraph={handleShareCountGraph}
        />
        <P>
          Shows the number of searches performed by the department, broken down by search type and
          race / ethnicity.
        </P>
        <S.ChartSubsection>
          <S.LineWrapper>
            <Line
              data={byCountLineData}
              loading={chartState.loading[SEARCHES_BY_TYPE]}
              iTickFormat={(t) => (t % 2 === 0 ? t : null)}
              iTickValues={chartState.yearSet}
              iAxisProps={{
                minDomain: { y: 1 },
              }}
            />
          </S.LineWrapper>
          <S.LegendBeside>
            <DataSubsetPicker
              label="Search Type"
              value={searchType}
              onChange={handleStopPurposeSelect}
              options={[SEARCH_TYPE_DEFAULT].concat(SEARCH_TYPES)}
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
    </S.Searches>
  );
}

export default Searches;
