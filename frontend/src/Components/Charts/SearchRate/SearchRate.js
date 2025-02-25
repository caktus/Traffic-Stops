import React, { useState, useEffect } from 'react';
import SearchRateStyled from './SearchRate.styled';
import * as S from '../ChartSections/ChartsCommon.styled';

// Data
import useDataset, { AGENCY_DETAILS, LIKELIHOOD_OF_SEARCH, LIKELIHOOD_OF_STOP } from '../../../Hooks/useDataset';

// Hooks
import useOfficerId from '../../../Hooks/useOfficerId';
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Constants
import {
  LIKELIHOOD_OF_STOP_TABLE_COLUMNS,
  STOP_REASON_TABLE_COLUMNS,
} from '../chartUtils';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import axios from '../../../Services/Axios';
import HorizontalBarChart from '../../NewCharts/HorizontalBarChart';
import { ChartContainer } from '../ChartSections/ChartsCommon.styled';

function SearchRate(props) {
  const { agencyId, yearRange, year } = props;
  const officerId = useOfficerId();

  const [searchChartState] = useDataset(agencyId, LIKELIHOOD_OF_SEARCH, AGENCY_DETAILS);
  const [stopChartState] = useDataset(agencyId, LIKELIHOOD_OF_STOP, AGENCY_DETAILS);

  const initSearchRateData = { labels: [], datasets: [], loading: true };
  const [searchRateData, setSearchRateData] = useState(initSearchRateData);

  const initStopRateData = { labels: [], datasets: [], loading: true };
  const [stopRateData, setStopRateData] = useState(initStopRateData);

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

  useEffect(() => {
    setSearchRateData(initSearchRateData);
    const params = [];
    if (year && year !== 'All') {
      params.push({ param: 'year', val: year });
    }
    if (officerId) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/search-rate/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
        setSearchRateData(res.data);
      })
      .catch((err) => console.log(err));
  }, [year]);

  useEffect(() => {
    setStopRateData(initStopRateData);
    const params = [];
    if (year && year !== 'All') {
      params.push({ param: 'year', val: year });
    }
    if (officerId) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/likelihood-of-stops/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
        const tableData = res.data.table_data;
        const colors = ['#9FD356', '#3C91E6', '#EFCEFA', '#2F4858', '#A653F4'];
        const data = {
          labels: ['Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets: [
            {
              axis: 'y',
              label: 'All', 
              data: res.data.stop_percentages,
              fill: false,
              backgroundColor: colors,
              borderColor: colors,
              hoverBackgroundColor: colors,
              borderWidth: 1, 
            },
          ],
          isModalOpen: false,
          tableData,
          csvData: tableData,
        }
        setStopRateData(data);
      })
      .catch((err) => console.log(err));
  }, [year]);

  const handleViewData = (type) => {
    switch (type) {
      case 'search':
        openModal(LIKELIHOOD_OF_SEARCH, STOP_REASON_TABLE_COLUMNS);
        break;
      case 'stop':
        openModal(LIKELIHOOD_OF_STOP, LIKELIHOOD_OF_STOP_TABLE_COLUMNS);
        break;
      default:
        break;
  };
};

  const formatTooltipLabel = (ctx) => ctx[0].dataset.label;
  const formatTooltipValue = (ctx) => `${ctx.label}: ${(ctx.raw * 100).toFixed(2)}%`;

  const subjectObserving = () => {
    if (officerId) {
      return 'by this officer';
    }
    if (agencyId === '-1') {
      return 'for the entire state';
    }
    return 'by this department';
  };

  const getBarChartModalSubHeading =
    () => `Shows the likelihood that drivers of a particular race / ethnicity are searched
                      compared to white drivers, based on stop cause. Stops done for “safety”
                      purposes may be less likely to show racial bias than stops done for “investigatory”
                      purposes ${subjectObserving()}.`;

  const getBarChartModalHeading = (title) => {
    let subject = searchChartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    let fromYear = ` since ${yearRange[yearRange.length - 1]}`;
    if (year && year !== 'All') {
      fromYear = ` in ${year}`;
    }
    return `${title} by ${subject}${fromYear}`;
  };

  return (
    <SearchRateStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader chartTitle="Likelihood of Search" handleViewData={() => handleViewData('search')} />
        <S.ChartDescription>
          <P>
            Shows the likelihood that drivers of a particular race / ethnicity are searched{' '}
            <strong>compared to white drivers</strong>, based on stop cause. Stops done for “safety”
            purposes may be less likely to show racial bias than stops done for “investigatory”
            purposes.
          </P>
          <P>
            <strong>NOTE:</strong> Large or unexpected percentages may be based on a low number of
            incidents. Use “View Data” to see the numbers underlying the calculations.
          </P>
        </S.ChartDescription>

        <ChartContainer override={{ height: '200vh' }}>
          <HorizontalBarChart
            title="Likelihood of Search"
            data={searchRateData}
            maintainAspectRatio={false}
            tooltipTitleCallback={formatTooltipLabel}
            tooltipLabelCallback={formatTooltipValue}
            legendPosition="bottom"
            pinMaxValue={false}
            modalConfig={{
              tableHeader: 'Likelihood of Search',
              tableSubheader: getBarChartModalSubHeading(),
              agencyName: searchChartState.data[AGENCY_DETAILS].name,
              chartTitle: getBarChartModalHeading('Likelihood of Search'),
            }}
          />
        </ChartContainer>
      </S.ChartSection>

      <S.ChartSection>
      <ChartHeader chartTitle="Likelihood of Stop" handleViewData={() => handleViewData('stop')} />
        <S.ChartDescription>
          <P>
            Shows the likelihood that drivers of a particular race / ethnicity are stopped{' '}
            <strong>compared to white drivers</strong>, based city population size.
          </P>
          <P>
            <strong>NOTE:</strong> Large or unexpected percentages may be based on a low number of
            incidents. Use “View Data” to see the numbers underlying the calculations.
          </P>
        </S.ChartDescription>

        <HorizontalBarChart
          title="Likelihood of Stop"
          data={stopRateData}
          maintainAspectRatio={true}
          displayLegend={false}
          tooltipLabelCallback={(ctx) => `${ctx.label}: ${(ctx.raw).toFixed(2)}%`}
          pinMaxValue={false}
          modalConfig={{
            tableHeader: 'Likelihood of Stop',
            tableSubheader: getBarChartModalSubHeading(
              'Watts-hillandale the indy edgemont sodu gregson street towerview drive jazz.'
            ),
            agencyName: searchChartState.data[AGENCY_DETAILS].name,
            chartTitle: getBarChartModalHeading('Likelihood of Stop'),
          }}
          />
      </S.ChartSection>
    </SearchRateStyled>
  );
}

export default SearchRate;