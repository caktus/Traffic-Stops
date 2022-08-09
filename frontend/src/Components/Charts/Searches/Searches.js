import React, { useEffect, useState } from 'react';
import SearchesStyled from './Searches.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Util
import {
  AVERAGE,
  calculateYearTotal,
  filterDataBySearchType,
  getSearchRateForYearByGroup,
  reduceStopReasonsByEthnicity,
  SEARCH_TYPE_DEFAULT,
  SEARCH_TYPES,
  STATIC_LEGEND_KEYS,
} from '../chartUtils';

// State
import useDataset, { SEARCHES, SEARCHES_BY_TYPE, STOPS } from '../../../Hooks/useDataset';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Elements
import { P } from '../../../styles/StyledComponents/Typography';

// Children
import Line from '../ChartPrimitives/Line';
import Legend from '../ChartSections/Legend/Legend';
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import useOfficerId from '../../../Hooks/useOfficerId';

function Searches(props) {
  const { agencyId } = props;
  const theme = useTheme();

  const officerId = useOfficerId();

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
  const [renderTableModal, { openModal }] = useTableModal();

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
    if (data && chartState.yearRange.length > 0) {
      const mappedData = [];
      const ethnicGroups = countEthnicGroups.filter((g) => g.selected).map((g) => g.value);
      const dataBySearchReason = filterDataBySearchType(data, searchType);
      ethnicGroups.forEach((ethnicGroup) => {
        const group = {};
        group.id = ethnicGroup;
        group.color = theme.colors.ethnicGroup[ethnicGroup];
        group.data = reduceStopReasonsByEthnicity(
          dataBySearchReason,
          chartState.yearRange,
          ethnicGroup,
          searchType
        );
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

  const handleViewPercentageData = () => {
    openModal([STOPS, SEARCHES], PERCENTAGE_COLUMNS);
  };

  const handleViewCountData = () => {
    openModal(SEARCHES_BY_TYPE, COUNT_COLUMNS);
  };

  const subjectObserving = () => {
    if (officerId) {
      return 'officer';
    }
    if (agencyId) {
      return 'department';
    }
    return '';
  };

  return (
    <SearchesStyled>
      {/* Search Rate */}
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader
          chartTitle="Searches by Percentage"
          handleViewData={handleViewPercentageData}
        />
        <S.ChartDescription>
          <P>Shows the percent of stops that led to searches, broken down by race/ethnicity.</P>
        </S.ChartDescription>
        <S.ChartSubsection showCompare={props.showCompare}>
          <S.LineWrapper>
            <Line
              data={byPercentageLineData}
              loading={[SEARCHES, STOPS].some((d) => chartState.loading[d])}
              iTickFormat={(t) => (t % 2 === 0 ? t : null)}
              iTickValues={chartState.yearSet}
              dAxisProps={{
                tickFormat: (t) => `${t}%`,
              }}
              yAxisLabel={(val) => `${val}%`}
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
        <ChartHeader chartTitle="Searches By Count" handleViewData={handleViewCountData} />
        <P>
          Shows the number of searches performed by the {subjectObserving()}, broken down by search
          type and race / ethnicity.
        </P>
        <S.ChartSubsection showCompare={props.showCompare}>
          <S.LineWrapper>
            <Line
              data={byCountLineData}
              loading={chartState.loading[SEARCHES_BY_TYPE]}
              iTickFormat={(t) => (t % 2 === 0 ? t : null)}
              iTickValues={chartState.yearSet}
              iAxisProps={{
                minDomain: { y: 1 },
              }}
              dAxisProps={{
                tickFormat: (t) => `${t}`,
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
    </SearchesStyled>
  );
}

export default Searches;

const PERCENTAGE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year',
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
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
  {
    Header: 'Asian*',
    accessor: 'asian',
  },
  {
    Header: 'Native American*',
    accessor: 'native_american',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Total',
    accessor: (row) => calculateYearTotal(row),
  },
];

const COUNT_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year',
  },
  {
    Header: 'Search-reason',
    accessor: 'search_type',
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
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
  {
    Header: 'Asian*',
    accessor: 'asian',
  },
  {
    Header: 'Native American*',
    accessor: 'native_american',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Total',
    accessor: (row) => calculateYearTotal(row),
  },
];
