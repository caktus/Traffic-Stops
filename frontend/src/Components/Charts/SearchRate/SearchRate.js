import React, { useState, useEffect } from 'react';
import SearchRateStyled from './SearchRate.styled';
import * as S from '../ChartSections/ChartsCommon.styled';

// Data
import useDataset, { AGENCY_DETAILS, LIKELIHOOD_OF_SEARCH } from '../../../Hooks/useDataset';

// Hooks
import useOfficerId from '../../../Hooks/useOfficerId';
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Constants
import { STOP_REASON_TABLE_COLUMNS, YEARS_DEFAULT } from '../chartUtils';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import axios from '../../../Services/Axios';
import HorizontalBarChart from '../../NewCharts/HorizontalBarChart';

function SearchRate(props) {
  const { agencyId, showCompare } = props;
  const officerId = useOfficerId();

  const [chartState] = useDataset(agencyId, LIKELIHOOD_OF_SEARCH);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const initData = { labels: [], datasets: [], loading: true };
  const [searchRateData, setSearchRateData] = useState(initData);

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

  useEffect(() => {
    setSearchRateData(initData);
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

  const handleYearSelected = (y) => {
    if (y === year) return;
    setYear(y);
  };

  const handleViewData = () => {
    openModal(LIKELIHOOD_OF_SEARCH, STOP_REASON_TABLE_COLUMNS);
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
    let subject = chartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    let fromYear = ` since ${chartState.yearRange[chartState.yearRange.length - 1]}`;
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
        <ChartHeader chartTitle="Likelihood of Search" handleViewData={handleViewData} />
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
        <S.ChartSubsection showCompare={showCompare}>
          <S.LineWrapper>
            <div style={{ height: '200vh' }}>
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
                  agencyName: chartState.data[AGENCY_DETAILS].name,
                  chartTitle: getBarChartModalHeading('Likelihood of Search'),
                }}
              />
            </div>
          </S.LineWrapper>
          <S.LegendBelow>
            <S.Spacing>
              <DataSubsetPicker
                label="Year"
                value={year}
                onChange={handleYearSelected}
                options={[YEARS_DEFAULT].concat(chartState.yearRange)}
                dropUp={!!showCompare}
              />
            </S.Spacing>
          </S.LegendBelow>
        </S.ChartSubsection>
      </S.ChartSection>
    </SearchRateStyled>
  );
}

export default SearchRate;
