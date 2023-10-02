import React, { useEffect, useState } from 'react';
import ContrabandStyled, { ChartWrapper } from './Contraband.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Util
import { STATIC_CONTRABAND_KEYS, STATIC_LEGEND_KEYS, YEARS_DEFAULT } from '../chartUtils';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// State
import useDataset, { AGENCY_DETAILS, CONTRABAND_HIT_RATE } from '../../../Hooks/useDataset';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import HorizontalBarChart from '../../NewCharts/HorizontalBarChart';
import axios from '../../../Services/Axios';
import NewModal from '../../NewCharts/NewModal';
import Legend from '../ChartSections/Legend/Legend';
import cloneDeep from 'lodash.clonedeep';

function Contraband(props) {
  const { agencyId, showCompare } = props;
  const theme = useTheme();

  const [chartState] = useDataset(agencyId, CONTRABAND_HIT_RATE);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();
  const [contrabandData, setContrabandData] = useState({ labels: [], datasets: [] });
  const [contrabandModalData, setContrabandModalData] = useState({
    isOpen: false,
    tableData: [],
    csvData: [],
  });
  const [contrabandYear, setContrabandYear] = useState(YEARS_DEFAULT);
  const [contrabandStopPurposeData, setContrabandStopPurposeData] = useState({
    labels: [],
    datasets: [],
  });
  const [contrabandStopPurposeModalData, setContrabandStopPurposeModalData] = useState({
    modalData: {},
    isOpen: false,
    tableData: [],
    csvData: [],
    selectedPurpose: 'Safety Violation',
    purposeTypes: ['Safety Violation', 'Regulatory and Equipment', 'Other'],
  });
  const [contrabandStopPurposeYear, setContrabandStopPurposeYear] = useState(YEARS_DEFAULT);
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
  const [contrabandTypes, setContrabandTypes] = useState(() =>
    STATIC_CONTRABAND_KEYS.map((k) => ({ ...k }))
  );

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  const handleContrabandYearSelect = (y) => {
    if (y === contrabandYear) return;
    setContrabandYear(y);
  };

  const handleGroupedContrabandYearSelect = (y) => {
    if (y === contrabandStopPurposeYear) return;
    setContrabandStopPurposeYear(y);
  };

  const handleViewData = () => {
    openModal(CONTRABAND_HIT_RATE, CONTRABAND_TABLE_COLUMNS);
  };
  // Build New Contraband Data
  useEffect(() => {
    let url = `/api/agency/${agencyId}/contraband/`;
    if (contrabandYear && contrabandYear !== 'All') {
      url = `${url}?year=${contrabandYear}`;
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
  }, [contrabandYear]);

  useEffect(() => {
    let url = `/api/agency/${agencyId}/contraband-stop-purpose/`;
    if (contrabandStopPurposeYear && contrabandStopPurposeYear !== 'All') {
      url = `${url}?year=${contrabandStopPurposeYear}`;
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
  }, [contrabandStopPurposeYear]);

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
        const stopPurposeDataSets = res.data.map((sp, _) => ({
          labels: ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets: sp.data.map((ds, _) => ({
            label: ds.contraband,
            data: ds.data,
            backgroundColor: colors[ds.contraband],
          })),
        }));
        setContrabandGroupedStopPurposeData(stopPurposeDataSets);
      })
      .catch((err) => console.log(err));
  }, [year]);

  useEffect(() => {
    const url = `/api/agency/${agencyId}/contraband-grouped-stop-purpose/modal/`;
    axios.get(url).then((res) => {
      setContrabandStopPurposeModalData({ ...contrabandStopPurposeModalData, modalData: res.data });
    });
  }, []);

  const showContrabandModal = () => {
    if (!chartState.data[CONTRABAND_HIT_RATE]) return;
    const tableData = [];
    chartState.data[CONTRABAND_HIT_RATE].contraband.forEach((e, i) => {
      const dataCounts = { ...e };
      delete dataCounts.year;
      // Need to assign explicitly otherwise the download data orders columns by alphabet.
      tableData.unshift({
        year: e.year,
        white: e.white,
        black: e.black,
        native_american: e.native_american,
        asian: e.asian,
        other: e.other,
        hispanic: e.hispanic,
        total: Object.values(dataCounts).reduce((a, b) => a + b, 0),
      });
    });
    const newState = {
      isOpen: true,
      tableData,
      csvData: tableData,
    };
    setContrabandModalData(newState);
  };

  const showGroupedContrabandModal = (stopPurpose = 'Safety Violation') => {
    const stopPurposeKey = {
      'Safety Violation': 'safety',
      'Regulatory and Equipment': 'regulatory',
      Other: 'other',
    };
    const tableData = [];
    let stopPurposeSelected = 'Safety Violation';
    if (typeof stopPurpose === 'string') {
      stopPurposeSelected = stopPurpose;
    }
    const modalData = contrabandStopPurposeModalData.modalData[stopPurposeKey[stopPurposeSelected]];
    modalData.labels.forEach((e, y) => {
      const races = ['white', 'black', 'hispanic', 'asian', 'native_american', 'other'];
      const row = {
        year: e,
      };
      const total = [];
      races.forEach((r, j) => {
        // The data is indexed by the stop purpose group, then the index of the race then the index of the year.
        row[r] = modalData.datasets[j]['data'][y];
        total.unshift(row[r]);
      });
      row['total'] = total.reduce((a, b) => a + b, 0);
      tableData.unshift(row);
    });
    const newState = {
      ...contrabandStopPurposeModalData,
      isOpen: true,
      tableData,
      csvData: tableData,
      selectedPurpose: stopPurposeSelected,
    };
    setContrabandStopPurposeModalData(newState);
  };

  const handleContrabandKeySelected = (type) => {
    const groupIndex = contrabandTypes.indexOf(contrabandTypes.find((t) => t.value === type.value));
    const updatedTypes = [...contrabandTypes];
    updatedTypes[groupIndex].selected = !updatedTypes[groupIndex].selected;
    setContrabandTypes(updatedTypes);

    const newContrabandState = cloneDeep(contrabandGroupedStopPurposeData);
    newContrabandState[0].datasets.forEach((s) => {
      // eslint-disable-next-line no-param-reassign
      s.hidden = !updatedTypes.find((t) => t.label === s.label).selected;
    });
    newContrabandState[1].datasets.forEach((r) => {
      // eslint-disable-next-line no-param-reassign
      r.hidden = !updatedTypes.find((t) => t.label === r.label).selected;
    });
    newContrabandState[2].datasets.forEach((i) => {
      // eslint-disable-next-line no-param-reassign
      i.hidden = !updatedTypes.find((t) => t.label === i.label).selected;
    });
    setContrabandGroupedStopPurposeData(newContrabandState);
  };

  const formatTooltipLabel = (ctx) => {
    if (ctx.length) {
      const context = ctx[0];
      return context.dataset.label;
    }
    return '';
  };

  const formatTooltipValue = (ctx) => `${ctx.raw.toFixed(1)}%`;

  return (
    <ContrabandStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader chartTitle='Contraband "Hit Rate"' handleViewData={showContrabandModal} />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches discovered illegal items for a given race / ethnic
            group.
          </P>
          <NewModal
            tableHeader='Contraband "Hit Rate"'
            tableSubheader="Shows the number of traffics stops broken down by purpose and race / ethnicity."
            agencyName={chartState.data[AGENCY_DETAILS].name}
            tableData={contrabandModalData.tableData}
            csvData={contrabandModalData.csvData}
            columns={CONTRABAND_TABLE_COLUMNS}
            tableDownloadName="Traffic Stops By Stop Purpose"
            isOpen={contrabandModalData.isOpen}
            closeModal={() => setContrabandModalData((state) => ({ ...state, isOpen: false }))}
          />
        </S.ChartDescription>
        <S.ChartSubsection showCompare={showCompare}>
          <ChartWrapper>
            <HorizontalBarChart
              title="Contraband Hit Rate"
              data={contrabandData}
              displayLegend={false}
              tooltipLabelCallback={formatTooltipValue}
            />
          </ChartWrapper>
          <S.LegendSection>
            <DataSubsetPicker
              label="Year"
              value={contrabandYear}
              onChange={handleContrabandYearSelect}
              options={[YEARS_DEFAULT].concat(chartState.yearRange)}
              dropUp={!!showCompare}
            />
          </S.LegendSection>
        </S.ChartSubsection>
      </S.ChartSection>
      <S.ChartSection>
        <ChartHeader
          chartTitle='Contraband "Hit Rate" By Stop Purpose'
          handleViewData={showGroupedContrabandModal}
        />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches discovered contraband for a given race / ethnic group
          </P>
        </S.ChartDescription>
        <NewModal
          tableHeader='Contraband "Hit Rate" Grouped by Stop Purpose'
          tableSubheader="Shows the number of traffics stops broken down by purpose and race / ethnicity."
          agencyName={chartState.data[AGENCY_DETAILS].name}
          tableData={contrabandStopPurposeModalData.tableData}
          csvData={contrabandStopPurposeModalData.csvData}
          columns={CONTRABAND_TABLE_COLUMNS}
          tableDownloadName="Traffic Stops By Stop Purpose"
          isOpen={contrabandStopPurposeModalData.isOpen}
          closeModal={() =>
            setContrabandStopPurposeModalData((state) => ({ ...state, isOpen: false }))
          }
        >
          <DataSubsetPicker
            label="Stop Purpose"
            value={contrabandStopPurposeModalData.selectedPurpose}
            onChange={showGroupedContrabandModal}
            options={contrabandStopPurposeModalData.purposeTypes}
          />
        </NewModal>
        <S.ChartSubsection showCompare={showCompare}>
          <ChartWrapper>
            <HorizontalBarChart
              title="Contraband Hit Rate Grouped By Stop Purpose"
              data={contrabandStopPurposeData}
              tooltipTitleCallback={formatTooltipLabel}
              tooltipLabelCallback={formatTooltipValue}
              displayStopPurposeTooltips
            />
          </ChartWrapper>
          <S.LegendSection>
            <DataSubsetPicker
              label="Year"
              value={contrabandStopPurposeYear}
              onChange={handleGroupedContrabandYearSelect}
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
              tooltipTitleCallback={formatTooltipLabel}
              tooltipLabelCallback={formatTooltipValue}
              displayLegend={false}
              xStacked
              yStacked
            />
            <HorizontalBarChart
              title=""
              data={contrabandGroupedStopPurposeData[1]}
              tooltipTitleCallback={formatTooltipLabel}
              tooltipLabelCallback={formatTooltipValue}
              displayLegend={false}
              xStacked
              yStacked
            />
            <HorizontalBarChart
              title=""
              data={contrabandGroupedStopPurposeData[2]}
              tooltipTitleCallback={formatTooltipLabel}
              tooltipLabelCallback={formatTooltipValue}
              displayLegend={false}
              xStacked
              yStacked
            />
          </div>
        </S.ChartSubsection>
        <Legend
          heading="Show on graph:"
          keys={contrabandTypes}
          onKeySelect={handleContrabandKeySelected}
          showNonHispanic={false}
        />
      </S.ChartSection>
    </ContrabandStyled>
  );
}

export default Contraband;

const CONTRABAND_TABLE_COLUMNS = [
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

const CONTRABAND_STOP_PURPOSE_TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year',
  },
  {
    Header: 'Safety Violation',
    accessor: 'safety',
  },
  {
    Header: 'Regulatory and Equipment',
    accessor: 'regulatory',
  },
  {
    Header: 'Other',
    accessor: 'other',
  },
  {
    Header: 'Total',
    accessor: 'total',
  },
];
