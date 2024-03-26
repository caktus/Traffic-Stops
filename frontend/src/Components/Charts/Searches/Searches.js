import React, { useEffect, useState } from 'react';
import SearchesStyled from './Searches.styled';
import * as S from '../ChartSections/ChartsCommon.styled';

// Util
import { RACE_TABLE_COLUMNS, SEARCH_TYPE_DEFAULT, SEARCH_TYPES } from '../chartUtils';

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
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import useOfficerId from '../../../Hooks/useOfficerId';
import displayDefinition from '../../../util/displayDefinition';
import { LineWrapper, StopGroupsContainer } from '../TrafficStops/TrafficStops.styled';
import LineChart from '../../NewCharts/LineChart';
import axios from '../../../Services/Axios';

function Searches(props) {
  const { agencyId } = props;

  const officerId = useOfficerId();

  useDataset(agencyId, STOPS);
  useDataset(agencyId, SEARCHES);
  const [chartState] = useDataset(agencyId, SEARCHES_BY_TYPE);

  useEffect(() => {
    if (window.location.hash) {
      document.querySelector(`${window.location.hash}`).scrollIntoView();
    }
  }, []);

  const [searchType, setSearchType] = useState(SEARCH_TYPE_DEFAULT);

  const [searchPercentageData, setSearchPercentageData] = useState({
    labels: [],
    datasets: [],
    loading: true,
  });

  const initCountData = {
    labels: [],
    datasets: [],
    loading: true,
  };
  const [searchCountData, setSearchCountData] = useState(initCountData);
  const [searchCountType, setSearchCountType] = useState(0);
  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

  // Build Searches By Percentage
  useEffect(() => {
    const params = [];
    if (officerId !== null) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/searches-by-percentage/?${urlParams}`;

    axios
      .get(url)
      .then((res) => {
        setSearchPercentageData(res.data);
      })
      .catch((err) => console.log(err));
  }, [searchCountType]);

  // Build Searches By Count
  useEffect(() => {
    setSearchCountData(initCountData);
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

  const handleViewPercentageData = () => {
    openModal([STOPS, SEARCHES], RACE_TABLE_COLUMNS);
  };

  const handleViewCountData = () => {
    openModal(SEARCHES_BY_TYPE, COUNT_COLUMNS);
  };

  const subjectObserving = () => {
    if (officerId) {
      return 'by this officer';
    }
    if (agencyId === '-1') {
      return 'for the entire state';
    }
    return 'by this department';
  };

  const getLineChartModalSubHeading = (title, showStopPurpose = false) => {
    let stopPurposeSelected = '';
    if (showStopPurpose) {
      stopPurposeSelected =
        searchCountType && searchCountType !== 0 // All
          ? ` for ${SEARCH_TYPES[searchCountType - 1]}`
          : '';
    }
    return `${title} ${subjectObserving()}${stopPurposeSelected}.`;
  };

  const getLineChartModalHeading = (title, showStopPurpose = false) => {
    let subject = chartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    let stopPurposeSelected = '';
    if (showStopPurpose) {
      stopPurposeSelected =
        searchCountType && searchCountType !== 0 // All
          ? ` for ${SEARCH_TYPES[searchCountType - 1]}`
          : '';
    }
    return `${title} by ${subject}${stopPurposeSelected} since ${searchCountData.labels[0]}`;
  };

  const formatTooltipLabel = (ctx) => {
    if (ctx.length) {
      const context = ctx[0];
      return context.label;
    }
    return '';
  };

  const formatTooltipValue = (ctx) => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(2)}%`;

  return (
    <SearchesStyled>
      {/* Search Rate */}
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection id="searches_by_percentage">
        <ChartHeader
          chartTitle="Searches by Percentage"
          handleViewData={handleViewPercentageData}
          shareProps={{
            graphAnchor: 'searches_by_percentage',
          }}
        />
        <P>Shows the percent of stops that led to searches, broken down by race/ethnicity.</P>
        <S.ChartSubsection showCompare={props.showCompare}>
          <LineWrapper visible>
            <StopGroupsContainer>
              <LineChart
                data={searchPercentageData}
                title="Searches By Percentage"
                maintainAspectRatio={false}
                showLegendOnBottom
                yScaleFormat="percent"
                tooltipTitleCallback={formatTooltipLabel}
                tooltipLabelCallback={formatTooltipValue}
                modalConfig={{
                  tableHeader: 'Searches By Percentage',
                  tableSubheader: getLineChartModalSubHeading(
                    'Shows the percent of stops that led to searches, broken down by race/ethnicity'
                  ),
                  agencyName: chartState.data[AGENCY_DETAILS].name,
                  chartTitle: getLineChartModalHeading('Searches By Percentage', false),
                }}
              />
            </StopGroupsContainer>
          </LineWrapper>
        </S.ChartSubsection>
      </S.ChartSection>
      {/* Searches by Count */}
      <S.ChartSection id="searches_by_count">
        <ChartHeader
          chartTitle="Searches By Count"
          handleViewData={handleViewCountData}
          shareProps={{
            graphAnchor: 'searches_by_count',
          }}
        />
        <P>
          Shows the number of searches performed {subjectObserving()}, broken down by search type
          and race / ethnicity.
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
                    `Shows the number of searches performed ${subjectObserving()}, broken down by search type and race / ethnicity`
                  ),
                  agencyName: chartState.data[AGENCY_DETAILS].name,
                  chartTitle: getLineChartModalHeading('Searches By Count', true),
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
