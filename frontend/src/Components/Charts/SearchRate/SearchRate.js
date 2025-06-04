import React, { useState, useEffect } from 'react';
import SearchRateStyled from './SearchRate.styled';
import * as S from '../ChartSections/ChartsCommon.styled';

// Data
import useDataset, {
  AGENCY_DETAILS,
  LIKELIHOOD_OF_SEARCH,
  LIKELIHOOD_OF_STOP,
} from '../../../Hooks/useDataset';

// Hooks
import useOfficerId from '../../../Hooks/useOfficerId';
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Constants
import {
  DEMOGRAPHICS_COLORS,
  LIKELIHOOD_OF_STOP_TABLE_COLUMNS,
  STOP_REASON_TABLE_COLUMNS,
} from '../chartUtils';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import axios from '../../../Services/Axios';
import HorizontalBarChart from '../../NewCharts/HorizontalBarChart';
import { ChartContainer } from '../ChartSections/ChartsCommon.styled';
import { useChartState } from '../../../Context/chart-state';

function SearchRate(props) {
  const { agencyId, yearRange, year } = props;
  const officerId = useOfficerId();

  const [searchChartState] = useDataset(agencyId, LIKELIHOOD_OF_SEARCH, AGENCY_DETAILS);
  const [stopChartState] = useDataset(agencyId, LIKELIHOOD_OF_STOP, AGENCY_DETAILS);

  const initSearchRateData = { labels: [], datasets: [], loading: true };
  const [searchRateData, setSearchRateData] = useState(initSearchRateData);

  const initStopRateData = { labels: [], datasets: [], loading: true };
  const [stopRateData, setStopRateData] = useState(initStopRateData);
  const [noACSData, setNoACSData] = useState(false);

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

  // eslint-disable-next-line no-unused-vars
  const [_, dispatch] = useChartState();

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
    setNoACSData(false);
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
        if (
          year && year !== 'All' &&
          (!res.data.stop_percentages || res.data.stop_percentages.length === 0)
        ) {
          setNoACSData(true);
          return;
        }
        setNoACSData(false);
        const tableData = [...res.data.table_data];
        const colors = [
          DEMOGRAPHICS_COLORS.black,
          DEMOGRAPHICS_COLORS.hispanic,
          DEMOGRAPHICS_COLORS.asian,
          DEMOGRAPHICS_COLORS.nativeAmerican,
          DEMOGRAPHICS_COLORS.other,
        ];
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
          csvData: [...tableData],
        };
        setStopRateData(data);

        dispatch({
          type: 'DATASET_FETCH_SUCCESS',
          dataset: LIKELIHOOD_OF_STOP,
          payload: res.data, // send raw API response
        });
      })
      .catch((err) => {
        if (
          year && year !== 'All' &&
          err.response &&
          (err.response.status === 404 || err.response.status === 500)
        ) {
          setNoACSData(true);
        } else {
          setNoACSData(false);
          console.log(err);
        }
      });
  }, [year, officerId, agencyId]);

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
    }
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

  const getBarChartModalSubHeading = (type) => {
    if (type === 'search') {
      return `Shows the likelihood that drivers of a particular race / ethnicity are searched
      compared to white drivers, based on stop cause. Stops done for "safety"
      purposes may be less likely to show racial bias than stops done for "investigatory"
      purposes ${subjectObserving()}.`;
    }
    if (type === 'stop') {
      return `Shows the likelihood that drivers of a particular race/ethnicity are stopped
      compared to white drivers, based on population estimates according to the most recent
      census. A Stop Rate Ratio of 1.0 (or 100%) indicates equal stop likelihood across
      groups, while values above or below 1.0 suggest disparities. ${subjectObserving()}`;
    }
  };

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
        <ChartHeader
          chartTitle="Likelihood of Stop"
          handleViewData={() => handleViewData('stop')}
          hideActions={!!officerId}
        />
        <S.ChartDescription>
          <P>
            Shows the likelihood that drivers of a particular race/ethnicity are stopped{' '}
            <strong>compared to white drivers</strong>, based on population estimates according to
            the most recent census. A Stop Rate Ratio of 1.0 (or 100%) indicates equal stop
            likelihood across groups, while values above or below 1.0 suggest disparities.
          </P>
          <P>
            <strong>NOTE:</strong> The Stop Rate Ratio is a simplified estimate and may not fully
            account for differences in driving behavior, such as how often individuals drive.
            However, it provides a general measure of potential racial and ethnic disparities in
            traffic stops.
          </P>
        </S.ChartDescription>
        {/* eslint-disable-next-line no-nested-ternary */}
        {officerId ? (
          <div style={{ textAlign: 'center', margin: '2em' }}>
            <h2>
              <em>This chart is not yet available at the officer level. Coming soon!</em>
            </h2>
          </div>
        ) : noACSData ? (
          <div style={{ textAlign: 'center', margin: '2em' }}>
            <h2>
              <em>5-year ACS data not available for the selected year</em>
            </h2>
          </div>
        ) : (
          <HorizontalBarChart
            title="Likelihood of Stop"
            data={stopRateData}
            maintainAspectRatio
            displayLegend={false}
            tooltipLabelCallback={(ctx) => {
              const pct = ctx.raw * 100;
              const isNegative = ctx.raw < 0;
              const likelihood = isNegative ? 'less' : 'more';
              let multiplier;
              if (isNegative) {
                multiplier = -(1 / (1 + ctx.raw));
              } else {
                multiplier = 1 + ctx.raw;
              }
              const rounded = Math.abs(multiplier).toFixed(2);
              return [
                `${ctx.label} drivers are ${Math.abs(pct).toFixed(0)}% ${likelihood} likely / ` +
                  (
                    isNegative
                      ? '-'
                      : ''
                  ) +
                  `${rounded}× as likely`,
                `to be pulled over as white drivers.`,
              ];
            }}
            pinMaxValue={false}
            modalConfig={{
              tableHeader: 'Likelihood of Stop',
              tableSubheader: getBarChartModalSubHeading('stop'),
              agencyName: stopChartState.data[AGENCY_DETAILS].name,
              chartTitle: getBarChartModalHeading('Likelihood of Stop'),
            }}
          />
        )}
      </S.ChartSection>

      <S.ChartSection>
        <ChartHeader
          chartTitle="Likelihood of Search"
          handleViewData={() => handleViewData('search')}
        />
        <S.ChartDescription>
          <P>
            Shows the likelihood that drivers of a particular race / ethnicity are searched{' '}
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <strong>compared to white drivers</strong>, based on stop cause. Stops done for "safety"
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            purposes may be less likely to show racial bias than stops done for "investigatory"
            purposes.
          </P>
          <P>
            <strong>NOTE:</strong> Large or unexpected percentages may be based on a low number of
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            incidents. Use "View Data" to see the numbers underlying the calculations.
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
              tableSubheader: getBarChartModalSubHeading('search'),
              agencyName: searchChartState.data[AGENCY_DETAILS].name,
              chartTitle: getBarChartModalHeading('Likelihood of Search'),
            }}
          />
        </ChartContainer>
      </S.ChartSection>
    </SearchRateStyled>
  );
}

export default SearchRate;
