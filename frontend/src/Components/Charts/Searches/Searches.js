import React, { useEffect, useState } from 'react';
import SearchesStyled from './Searches.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Util
import {
  AVERAGE,
  getSearchRateForYearByGroup,
  SEARCH_TYPE_DEFAULT,
  SEARCH_TYPES,
  STATIC_LEGEND_KEYS,
} from '../chartUtils';

// State
import useDataset, {
  AGENCY_DETAILS,
  SEARCHES,
  SEARCHES_BY_TYPE,
  STOPS,
} from '../../../Hooks/useDataset';

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
import displayDefinition from '../../../util/displayDefinition';
import { LineWrapper, StopGroupsContainer } from '../TrafficStops/TrafficStops.styled';
import LineChart from '../../NewCharts/LineChart';
import axios from '../../../Services/Axios';
import getDownloadableTitle from '../../../util/getDownloadableTitle';

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

  const [byPercentageLineData, setByPercentageLineData] = useState();

  const [searchCountData, setSearchCountData] = useState({ labels: [], datasets: [] });
  const [searchCountType, setSearchCountType] = useState(0);
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

  // Build Searches By Count
  useEffect(() => {
    const params = [];
    if (searchType !== 0) {
      params.push({ param: 'search_type', val: searchCountType });
    }
    if (officerId !== null) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/searches-by-count/?${urlParams}`;

    axios
      .get(url)
      .then((res) => {
        setSearchCountData(res.data);
      })
      .catch((err) => console.log(err));
  }, [searchCountType]);

  /* INTERACTIONS */
  // Handle search type dropdown state
  const handleStopPurposeSelect = (s, i) => {
    if (s === searchType) return;
    setSearchType(s);
    setSearchCountType(i);
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

  const getLineChartModalSubHeading = (title, showStopPurpose = false) => {
    let stopPurposeSelected = '';
    if (showStopPurpose) {
      stopPurposeSelected =
        searchCountType && searchCountType !== 0 // All
          ? ` for ${SEARCH_TYPES[searchCountType - 1]}`
          : '';
    }
    return `${title} by this ${subjectObserving()}${stopPurposeSelected}.`;
  };

  const getLineChartModalHeading = (title, showStopPurpose = false, download = false) => {
    let subject = chartState.data[AGENCY_DETAILS].name;
    if (subjectObserving() === 'officer') {
      subject = `Officer ${officerId}`;
    }
    let stopPurposeSelected = '';
    if (showStopPurpose) {
      stopPurposeSelected =
        searchCountType && searchCountType !== 0 // All
          ? ` for ${SEARCH_TYPES[searchCountType - 1]}`
          : '';
    }
    let heading = `${title} by ${subject}${stopPurposeSelected} since ${searchCountData.labels[0]}`;
    if (download) {
      heading = getDownloadableTitle(heading);
    }
    return heading;
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
                direction="column"
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
          <LineWrapper visible>
            <StopGroupsContainer>
              <LineChart
                data={searchCountData}
                title="Searches By Count"
                maintainAspectRatio={false}
                showLegendOnBottom
                modalConfig={{
                  tableHeader: 'Searches By Count',
                  tableSubheader: getLineChartModalSubHeading(
                    'Shows the number of searches performed by the {subjectObserving()}, broken down by search type and race / ethnicity'
                  ),
                  agencyName: chartState.data[AGENCY_DETAILS].name,
                  chartTitle: getLineChartModalHeading('Searches By Count'),
                  fileName: getLineChartModalHeading('Searches By Count', false, true),
                }}
              />
            </StopGroupsContainer>
          </LineWrapper>
          <S.LegendBeside>
            <DataSubsetPicker
              label="Search Type"
              value={searchType}
              onChange={handleStopPurposeSelect}
              options={[SEARCH_TYPE_DEFAULT].concat(SEARCH_TYPES)}
            />
            <p style={{ marginTop: '10px' }}>{displayDefinition(searchType)}</p>
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
    accessor: 'total',
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
    accessor: 'total',
  },
];
