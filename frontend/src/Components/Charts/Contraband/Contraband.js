import React, { useEffect, useState } from 'react';
import ContrabandStyled, {
  BarContainer,
  ChartWrapper,
  HorizontalBarWrapper,
} from './Contraband.styled';
import * as S from '../ChartSections/ChartsCommon.styled';

// Util
import { CONTRABAND_TYPES, STATIC_CONTRABAND_KEYS, YEARS_DEFAULT } from '../chartUtils';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// State
import useDataset, { AGENCY_DETAILS, CONTRABAND_HIT_RATE } from '../../../Hooks/useDataset';

// Children
import { P, WEIGHTS } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import HorizontalBarChart from '../../NewCharts/HorizontalBarChart';
import axios from '../../../Services/Axios';
import NewModal from '../../NewCharts/NewModal';
import Legend from '../ChartSections/Legend/Legend';
import cloneDeep from 'lodash.clonedeep';
import Checkbox from '../../Elements/Inputs/Checkbox';

const STOP_PURPOSE_TYPES = ['Safety Violation', 'Regulatory and Equipment', 'Other'];

function Contraband(props) {
  const { agencyId, showCompare } = props;

  const [chartState] = useDataset(agencyId, CONTRABAND_HIT_RATE);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const renderMetaTags = useMetaTags();
  const [renderTableModal] = useTableModal();
  const [contrabandData, setContrabandData] = useState({
    labels: [],
    datasets: [],
    isModalOpen: false,
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
    selectedPurpose: STOP_PURPOSE_TYPES[0],
  });

  const [groupedContrabandStopPurposeModalData, setGroupedContrabandStopPurposeModalData] =
    useState({
      modalData: {},
      isOpen: false,
      tableData: [],
      csvData: [],
    });

  const [contrabandStopPurposeYear, setContrabandStopPurposeYear] = useState(YEARS_DEFAULT);

  const initialContrabandGroupedData = [
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
  ];
  const [contrabandGroupedStopPurposeData, setContrabandGroupedStopPurposeData] = useState(
    initialContrabandGroupedData
  );
  const [shouldRedrawContrabandGraphs, setShouldReDrawContrabandGraphs] = useState(true);
  const [contrabandTypes, setContrabandTypes] = useState(() =>
    STATIC_CONTRABAND_KEYS.map((k) => ({ ...k }))
  );

  const [selectedGroupedContrabandType, setSelectedGroupedContrabandType] = useState(
    CONTRABAND_TYPES[0]
  );
  const [selectedGroupedContrabandStopPurpose, setSelectedGroupedContrabandStopPurpose] = useState(
    STOP_PURPOSE_TYPES[0]
  );

  const [visibleContrabandTypes, setVisibleContrabandTypes] = useState([
    {
      key: 'safety',
      title: 'Safety Violation',
      visible: true,
      order: 1,
    },
    {
      key: 'regulatory',
      title: 'Regulatory/Equipment',
      visible: true,
      order: 2,
    },
    {
      key: 'other',
      title: 'Other',
      visible: false,
      order: 3,
    },
  ]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
    setContrabandGroupedStopPurposeData(initialContrabandGroupedData);
    fetchHitRateByStopPurpose(y);
  };

  const handleContrabandYearSelect = (y) => {
    if (y === contrabandYear) return;
    setContrabandYear(y);
  };

  const handleGroupedContrabandYearSelect = (y) => {
    if (y === contrabandStopPurposeYear) return;
    setContrabandStopPurposeYear(y);
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
        const tableData = [];
        const resTableData = JSON.parse(res.data.table_data);
        resTableData.data.forEach((e) => {
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
        const colors = ['#02bcbb', '#8879fc', '#9c0f2e', '#ffe066', '#0c3a66', '#9e7b9b'];
        const data = {
          labels: ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets: [
            {
              axis: 'y',
              label: 'All',
              data: res.data.contraband_percentages,
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
          'Safety Violation': '#b173bc',
          'Regulatory Equipment': '#e69500',
          Other: '#7dd082',
        };
        const stopPurposeDataSets = res.data.contraband_percentages.map((ds) => ({
          axis: 'x',
          label: ds.stop_purpose,
          data: ds.data,
          fill: false,
          backgroundColor: colors[ds.stop_purpose],
          borderColor: colors[ds.stop_purpose],
          hoverBackgroundColor: colors[ds.stop_purpose],
          borderWidth: 1,
        }));
        const data = {
          labels: ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets: stopPurposeDataSets,
        };
        setContrabandStopPurposeData(data);
        setContrabandStopPurposeModalData({
          ...contrabandStopPurposeModalData,
          modalData: res.data.table_data,
        });
      })
      .catch((err) => console.log(err));
  }, [contrabandStopPurposeYear]);

  useEffect(() => {
    fetchHitRateByStopPurpose('All');
  }, []);

  const fetchHitRateByStopPurpose = (yr) => {
    let url = `/api/agency/${agencyId}/contraband-grouped-stop-purpose/`;
    if (yr && yr !== 'All') {
      url = `${url}?year=${yr}`;
    }
    axios
      .get(url)
      .then((res) => {
        updateContrabandHitRateByStopPurpose(res.data);
      })
      .catch((err) => console.log(err));
  };

  const updateContrabandHitRateByStopPurpose = (data) => {
    const colors = {
      Drugs: '#3C91E6',
      Alcohol: '#9FD356',
      Weapons: '#ED217C',
      Money: '#EFCEFA',
      Other: '#2F4858',
    };
    const stopPurposeDataSets = data.map((sp) => ({
      labels: ['W', 'B', 'H', 'A', 'NA', 'O'],
      datasets: sp.data.map((ds) => ({
        label: ds.contraband,
        data: ds.data,
        backgroundColor: colors[ds.contraband],
        hoverBackgroundColor: colors[ds.contraband],
      })),
    }));
    setContrabandGroupedStopPurposeData(stopPurposeDataSets);
    setShouldReDrawContrabandGraphs(false);
  };

  useEffect(() => {
    const url = `/api/agency/${agencyId}/contraband-grouped-stop-purpose/modal/?grouped_stop_purpose=${selectedGroupedContrabandStopPurpose}&contraband_type=${selectedGroupedContrabandType}`;
    axios.get(url).then((res) => {
      const tableData = JSON.parse(res.data.table_data)['data'];
      updateGroupedContrabandModalData(tableData);
    });
  }, [selectedGroupedContrabandStopPurpose, selectedGroupedContrabandType]);

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

  const toggleGroupedPurposeGraphs = (key) => {
    const toggleState = visibleContrabandTypes;
    const toggleGraph = toggleState.find((v) => v.key === key);
    const otherGraphs = toggleState.filter((v) => v.key !== key);

    setVisibleContrabandTypes(
      [
        ...otherGraphs,
        { key, visible: !toggleGraph.visible, title: toggleGraph.title, order: toggleGraph.order },
      ].sort(
        // eslint-disable-next-line no-nested-ternary
        (a, b) => (a.order < b.order ? (a.order === b.order ? 0 : -1) : 1)
      )
    );
    setShouldReDrawContrabandGraphs(true);
    setTimeout(() => {
      setShouldReDrawContrabandGraphs(false);
    }, 1000);
  };

  const handleGroupedContrabandTypeSelect = (c) => {
    if (c === selectedGroupedContrabandType) return;
    setSelectedGroupedContrabandType(c);
  };

  const handleGroupedContrabandStopPurposeSelect = (c) => {
    if (c === selectedGroupedContrabandStopPurpose) return;
    setSelectedGroupedContrabandStopPurpose(c);
  };

  const updateGroupedContrabandModalData = (modalData) => {
    modalData.forEach((e) => {
      const races = ['white', 'black', 'hispanic', 'asian', 'native_american', 'other'];
      races.forEach((r) => {
        e[r] = e[r] || 0;
      });
      e['total'] = races.map((r) => e[r]).reduce((a, b) => a + b, 0);
    });
    const tableData = modalData
      // eslint-disable-next-line no-nested-ternary
      .sort((a, b) => (a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0));
    const newState = {
      ...groupedContrabandStopPurposeModalData,
      tableData,
      csvData: tableData,
    };
    setGroupedContrabandStopPurposeModalData(newState);
  };

  return (
    <ContrabandStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader
          chartTitle='Contraband "Hit Rate"'
          handleViewData={() => setContrabandData((state) => ({ ...state, isOpen: true }))}
        />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches discovered illegal items for a given race / ethnic
            group.
          </P>
          <NewModal
            tableHeader='Contraband "Hit Rate"'
            tableSubheader="Shows the number of traffics stops broken down by purpose and race / ethnicity."
            agencyName={chartState.data[AGENCY_DETAILS].name}
            tableData={contrabandData.tableData}
            csvData={contrabandData.csvData}
            columns={CONTRABAND_TABLE_COLUMNS}
            tableDownloadName="Traffic Stops By Stop Purpose"
            isOpen={contrabandData.isOpen}
            closeModal={() => setContrabandData((state) => ({ ...state, isOpen: false }))}
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
            options={STOP_PURPOSE_TYPES}
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
      <S.ChartSection marginTop={5}>
        <ChartHeader
          chartTitle='Contraband "Hit Rate" By Stop Purpose'
          handleViewData={() =>
            setGroupedContrabandStopPurposeModalData((state) => ({ ...state, isOpen: true }))
          }
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
          tableData={groupedContrabandStopPurposeModalData.tableData}
          csvData={groupedContrabandStopPurposeModalData.csvData}
          columns={CONTRABAND_TABLE_COLUMNS}
          tableDownloadName="Traffic Stops By Stop Purpose"
          isOpen={groupedContrabandStopPurposeModalData.isOpen}
          closeModal={() =>
            setGroupedContrabandStopPurposeModalData((state) => ({ ...state, isOpen: false }))
          }
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <DataSubsetPicker
              label="Stop Purpose"
              value={selectedGroupedContrabandStopPurpose}
              onChange={handleGroupedContrabandStopPurposeSelect}
              options={STOP_PURPOSE_TYPES}
            />
            <DataSubsetPicker
              label="Contraband Type"
              value={selectedGroupedContrabandType}
              onChange={handleGroupedContrabandTypeSelect}
              options={CONTRABAND_TYPES}
            />
          </div>
        </NewModal>
        <div style={{ marginTop: '1em' }}>
          <P weight={WEIGHTS[1]}>Toggle graphs:</P>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'row', flexWrap: 'wrap' }}>
            {visibleContrabandTypes.map((vg, i) => (
              <Checkbox
                height={25}
                width={25}
                label={vg.title}
                value={vg.key}
                key={i}
                checked={vg.visible}
                onChange={toggleGroupedPurposeGraphs}
              />
            ))}
          </div>
        </div>
        <DataSubsetPicker
          label="Year"
          value={year}
          onChange={handleYearSelect}
          options={[YEARS_DEFAULT].concat(chartState.yearRange)}
          dropUp={!!showCompare}
        />
        <HorizontalBarWrapper>
          <BarContainer visible={visibleContrabandTypes[0].visible}>
            <HorizontalBarChart
              title="Safety Violation"
              maintainAspectRatio={false}
              data={contrabandGroupedStopPurposeData[0]}
              tooltipTitleCallback={formatTooltipLabel}
              tooltipLabelCallback={formatTooltipValue}
              displayLegend={false}
              xStacked
              yStacked
              redraw={shouldRedrawContrabandGraphs}
            />
          </BarContainer>
          <BarContainer visible={visibleContrabandTypes[1].visible}>
            <HorizontalBarChart
              title="Regulatory/Equipment"
              maintainAspectRatio={false}
              data={contrabandGroupedStopPurposeData[1]}
              tooltipTitleCallback={formatTooltipLabel}
              tooltipLabelCallback={formatTooltipValue}
              displayLegend={false}
              yAxisShowLabels={!visibleContrabandTypes[0].visible}
              xStacked
              yStacked
              redraw={shouldRedrawContrabandGraphs}
            />
          </BarContainer>
          <BarContainer visible={visibleContrabandTypes[2].visible}>
            <HorizontalBarChart
              title="Other"
              maintainAspectRatio={false}
              data={contrabandGroupedStopPurposeData[2]}
              tooltipTitleCallback={formatTooltipLabel}
              tooltipLabelCallback={formatTooltipValue}
              displayLegend={false}
              yAxisShowLabels={
                !visibleContrabandTypes[0].visible && !visibleContrabandTypes[1].visible
              }
              xStacked
              yStacked
              redraw={shouldRedrawContrabandGraphs}
            />
          </BarContainer>
        </HorizontalBarWrapper>
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
