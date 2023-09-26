import React, { useEffect, useState } from 'react';
import ContrabandStyled, { ChartWrapper } from './Contraband.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Util
import toTitleCase from '../../../util/toTitleCase';
import {
  reduceYearsToTotal,
  calculatePercentage,
  getQuantityForYear,
  CONTRABAND_TYPES,
  CONTRABAND_DEFAULT,
  RACES,
  YEARS_DEFAULT,
} from '../chartUtils';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// State
import useDataset, { CONTRABAND_HIT_RATE } from '../../../Hooks/useDataset';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import HorizontalBarChart from '../../NewCharts/HorizontalBarChart';
import axios from '../../../Services/Axios';

function SearchRate(props) {
  const { agencyId, showCompare } = props;
  const theme = useTheme();

  const [chartState] = useDataset(agencyId, CONTRABAND_HIT_RATE);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();
  const [contrabandData, setContrabandData] = useState({ labels: [], datasets: [] });
  const [contrabandStopPurposeData, setContrabandStopPurposeData] = useState({
    labels: [],
    datasets: [],
  });
  const [contrabandGroupedStopPurposeData, setContrabandGroupedStopPurposeData] = useState([
    {
      labels: [],
      datasets: [],
    },
    {
      labels: [],
      datasets: [],
    },
    {
      labels: [],
      datasets: [],
    },
  ]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  const handleViewData = () => {
    openModal(CONTRABAND_HIT_RATE, TABLE_COLUMNS);
  };
  // Build New Contraband Data
  useEffect(() => {
    let url = `/api/agency/${agencyId}/contraband/`;
    if (year && year !== 'All') {
      url = `${url}?year=${year}`;
    }
    axios
      .get(url)
      .then((res) => {
        const colors = ['#80d9d8', '#beb4fa', '#ca8794', '#ffeeb2', '#8598ac', '#cab6c7'];
        const data = {
          labels: ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets: [
            {
              axis: 'y',
              label: 'All',
              data: res.data,
              fill: false,
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1,
            },
          ],
        };
        setContrabandData(data);
      })
      .catch((err) => console.log(err));
  }, [year]);

  useEffect(() => {
    let url = `/api/agency/${agencyId}/contraband-stop-purpose/`;
    if (year && year !== 'All') {
      url = `${url}?year=${year}`;
    }
    axios
      .get(url)
      .then((res) => {
        const colors = {
          'Safety Violation': '#CFA9D6',
          'Regulatory Equipment': '#ffa500',
          Other: '#ACE1AF',
        };
        const stopPurposeDataSets = res.data.map((ds, _) => ({
          axis: 'x',
          label: ds.stop_purpose,
          data: ds.data,
          fill: false,
          backgroundColor: colors[ds.stop_purpose],
          borderColor: colors[ds.stop_purpose],
          borderWidth: 1,
        }));
        const data = {
          labels: ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets: stopPurposeDataSets,
        };
        setContrabandStopPurposeData(data);
      })
      .catch((err) => console.log(err));
  }, [year]);

  useEffect(() => {
    let url = `/api/agency/${agencyId}/contraband-grouped-stop-purpose/`;
    if (year && year !== 'All') {
      url = `${url}?year=${year}`;
    }
    axios
      .get(url)
      .then((res) => {
        const colors = {
          Drugs: '#feaba6',
          Alcohol: '#86c6dd',
          Weapons: '#c2e9bf',
          Money: '#dbc3df',
          Other: '#ffd4a0',
        };
        console.log(res.data);
        const stopPurposeDataSets = res.data.map((sp, _) => ({
          labels: ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets: sp.data.map((ds, _) => ({
            label: ds.contraband,
            data: ds.data,
            backgroundColor: colors[ds.contraband],
          })),
        }));
        console.log(stopPurposeDataSets);
        setContrabandGroupedStopPurposeData(stopPurposeDataSets);
      })
      .catch((err) => console.log(err));
  }, [year]);

  return (
    <ContrabandStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader chartTitle='Contraband "Hit Rate"' handleViewData={handleViewData} />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches discovered illegal items for a given race / ethnic
            group.
          </P>
        </S.ChartDescription>
        <S.ChartSubsection showCompare={showCompare}>
          <ChartWrapper>
            <HorizontalBarChart
              title="Contraband Hit Rate"
              data={contrabandData}
              displayLegend={false}
              tooltipLabelCallback={(ctx) => `${ctx.raw.toFixed(1)}%`}
            />
          </ChartWrapper>
          <S.LegendSection>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelect}
              options={[YEARS_DEFAULT].concat(chartState.yearRange)}
              dropUp={!!showCompare}
            />
          </S.LegendSection>
        </S.ChartSubsection>
      </S.ChartSection>
      <S.ChartSection>
        <ChartHeader
          chartTitle='Contraband "Hit Rate" By Stop Purpose'
          handleViewData={handleViewData}
        />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches discovered contraband for a given race / ethnic group
          </P>
        </S.ChartDescription>
        <S.ChartSubsection showCompare={showCompare}>
          <ChartWrapper>
            <HorizontalBarChart
              title="Contraband Hit Rate Grouped By Stop Purpose"
              data={contrabandStopPurposeData}
              tooltipTitleCallback={(ctx) => {
                if (ctx.length) {
                  const context = ctx[0];
                  return context.dataset.label;
                }
                return '';
              }}
              tooltipLabelCallback={(ctx) => `${ctx.raw.toFixed(1)}%`}
            />
          </ChartWrapper>
          <S.LegendSection>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelect}
              options={[YEARS_DEFAULT].concat(chartState.yearRange)}
              dropUp={!!showCompare}
            />
          </S.LegendSection>
        </S.ChartSubsection>
      </S.ChartSection>
      <S.ChartSection>
        <ChartHeader
          chartTitle='Contraband "Hit Rate" By Stop Purpose'
          handleViewData={handleViewData}
        />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches discovered contraband for a given race / ethnic group
          </P>
        </S.ChartDescription>
        <S.LegendSection>
          <DataSubsetPicker
            label="Year"
            value={year}
            onChange={handleYearSelect}
            options={[YEARS_DEFAULT].concat(chartState.yearRange)}
            dropUp={!!showCompare}
          />
        </S.LegendSection>
        <S.ChartSubsection showCompare={showCompare}>
          <div style={{ display: 'flex', flexDirection: 'row', overflowX: 'scroll' }}>
            <HorizontalBarChart
              title=""
              data={contrabandGroupedStopPurposeData[0]}
              tooltipLabelCallback={(ctx) => `${ctx.raw.toFixed(1)}%`}
              xStacked
              yStacked
            />
            <HorizontalBarChart
              title=""
              data={contrabandGroupedStopPurposeData[1]}
              tooltipLabelCallback={(ctx) => `${ctx.raw.toFixed(1)}%`}
              xStacked
              yStacked
            />
            <HorizontalBarChart
              title=""
              data={contrabandGroupedStopPurposeData[2]}
              tooltipLabelCallback={(ctx) => `${ctx.raw.toFixed(1)}%`}
              xStacked
              yStacked
            />
          </div>
        </S.ChartSubsection>
      </S.ChartSection>
    </ContrabandStyled>
  );
}

export default SearchRate;

const TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year', // accessor is the "key" in the data
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
    Header: 'Native American*',
    accessor: 'native_american',
  },
  {
    Header: 'Asian*',
    accessor: 'asian',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
  {
    Header: 'Total',
    accessor: 'total',
  },
];
