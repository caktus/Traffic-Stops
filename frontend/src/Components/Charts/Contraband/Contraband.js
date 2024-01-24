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
import toTitleCase from '../../../util/toTitleCase';
import useOfficerId from '../../../Hooks/useOfficerId';

const STOP_PURPOSE_TYPES = ['Safety Violation', 'Regulatory and Equipment', 'Other'];

function Contraband(props) {
  const { agencyId, showCompare } = props;

  const officerId = useOfficerId();
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
  const [contrabandTypesData, setContrabandTypesData] = useState({
    labels: [],
    datasets: [],
    isModalOpen: false,
    tableData: [],
    csvData: [],
  });

  const [contrabandTypesYear, setContrabandTypesYear] = useState(YEARS_DEFAULT);
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
  const handleContrabandTypesYearSelect = (y) => {
    if (y === contrabandTypesYear) return;
    setContrabandTypesYear(y);
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
    let url = `/api/agency/${agencyId}/contraband-types/`;
    if (contrabandTypesYear && contrabandTypesYear !== 'All') {
      url = `${url}?year=${contrabandTypesYear}`;
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
            alcohol: e.alcohol,
            drugs: e.drugs,
            money: e.money,
            other: e.other,
            weapons: e.weapons,
            total: Object.values(dataCounts).reduce((a, b) => a + b, 0),
          });
        });
        const colors = ['#9FD356', '#3C91E6', '#EFCEFA', '#2F4858', '#A653F4'];
        const data = {
          labels: ['Alcohol', 'Drugs', 'Money', 'Other', 'Weapons'],
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
        setContrabandTypesData(data);
      })
      .catch((err) => console.log(err));
  }, [contrabandTypesYear]);

  useEffect(() => {
    let url = `/api/agency/${agencyId}/contraband-stop-purpose/`;
    if (contrabandStopPurposeYear && contrabandStopPurposeYear !== 'All') {
      url = `${url}?year=${contrabandStopPurposeYear}`;
    }
    axios
      .get(url)
      .then((res) => {
        const colors = {
          'Safety Violation': '#5F0F40',
          'Regulatory Equipment': '#E36414',
          Other: '#0F4C5C',
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
      Alcohol: '#9FD356',
      Drugs: '#3C91E6',
      Money: '#EFCEFA',
      Other: '#2F4858',
      Weapons: '#A653F4',
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
    const url = `/api/agency/${agencyId}/contraband-grouped-stop-purpose/modal/?grouped_stop_purpose=${selectedGroupedContrabandStopPurpose}&contraband_type=${toTitleCase(
      selectedGroupedContrabandType
    )}`;
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

  const formatTooltipValue = (ctx) => `${(ctx.raw * 100).toFixed(2)}%`;

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

  const subjectObserving = () => {
    if (officerId) {
      return 'officer';
    }
    if (agencyId) {
      return 'department';
    }
    return '';
  };

  const getBarChartModalSubHeading = (title) => `${title} by this ${subjectObserving()}.`;

  const getBarChartModalHeading = (title, yearSelected) => {
    let subject = chartState.data[AGENCY_DETAILS].name;
    if (subjectObserving() === 'officer') {
      subject = `Officer ${officerId}`;
    }
    let fromYear = ` since ${chartState.yearRange[chartState.yearRange.length - 1]}`;
    if (yearSelected && yearSelected !== 'All') {
      fromYear = ` in ${yearSelected}`;
    }
    return `${title} by ${subject}${fromYear}`;
  };

  return (
    <ContrabandStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <details>
        <summary style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{ width: '20px', height: '20px' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <P>Shortcomings in the Official Data Impacting this Graph</P>
        </summary>
        <span>
          The data indicates that sometimes illegal items are found during traffic stops, even
          though there is no direct match for the type of illegal item associated with that stop.
          This happens because very small amounts of illegal items seem to be changed to zero when
          the data is recorded by the local agency or the NCDOJ (North Carolina Department of
          Justice) computers. When the amounts of illegal items are entered into the system, they
          are rounded either up or down to the nearest whole number. For example, if there&apos;s
          0.49 units of an illegal item, it&apos;s recorded as 0 units. This issue with the data
          seems to affect only cases involving drugs and alcohol, where someone might be found with
          a tiny fraction of the illegal substance
        </span>
      </details>
      <S.ChartSection>
        <ChartHeader
          chartTitle='Contraband "Hit Rate"'
          handleViewData={() => setContrabandData((state) => ({ ...state, isOpen: true }))}
        />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches led to the discovery of illegal items by
            race/ethnicity.
          </P>
          <NewModal
            tableHeader='Contraband "Hit Rate"'
            tableSubheader="Shows what percentage of searches led to the discovery of illegal items by race/ethnicity."
            agencyName={chartState.data[AGENCY_DETAILS].name}
            tableData={contrabandData.tableData}
            csvData={contrabandData.csvData}
            columns={CONTRABAND_TABLE_COLUMNS}
            tableDownloadName='Contraband "Hit Rate"'
            isOpen={contrabandData.isOpen}
            closeModal={() => setContrabandData((state) => ({ ...state, isOpen: false }))}
          />
        </S.ChartDescription>
        <S.ChartSubsection showCompare={showCompare}>
          <ChartWrapper>
            <HorizontalBarChart
              title='Contraband "Hit Rate"'
              data={contrabandData}
              displayLegend={false}
              tooltipLabelCallback={formatTooltipValue}
              modalConfig={{
                tableHeader: 'Contraband "Hit Rate"',
                tableSubheader: getBarChartModalSubHeading(
                  'Shows what percentage of searches led to the discovery of illegal items by race/ethnicity'
                ),
                agencyName: chartState.data[AGENCY_DETAILS].name,
                chartTitle: getBarChartModalHeading('Contraband "Hit Rate"', contrabandYear),
              }}
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
          chartTitle='Contraband "Hit Rate" Grouped By Stop Purpose'
          handleViewData={showGroupedContrabandModal}
        />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches led to the discovery of illegal items broken down by
            race/ethnicity and original stop purpose.
          </P>
        </S.ChartDescription>
        <NewModal
          tableHeader='Contraband "Hit Rate" Grouped By Stop Purpose'
          tableSubheader="Shows what percentage of searches led to the discovery of illegal items broken down by race/ethnicity and original stop purpose."
          agencyName={chartState.data[AGENCY_DETAILS].name}
          tableData={contrabandStopPurposeModalData.tableData}
          csvData={contrabandStopPurposeModalData.csvData}
          columns={CONTRABAND_TABLE_COLUMNS}
          tableDownloadName='Contraband "Hit Rate" Grouped By Stop Purpose'
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
              title='Contraband "Hit Rate" Grouped By Stop Purpose'
              data={contrabandStopPurposeData}
              tooltipTitleCallback={formatTooltipLabel}
              tooltipLabelCallback={formatTooltipValue}
              displayStopPurposeTooltips
              modalConfig={{
                tableHeader: 'Contraband "Hit Rate" Grouped By Stop Purpose',
                tableSubheader: getBarChartModalSubHeading(
                  'Shows what percentage of searches led to the discovery of illegal items broken down by race/ethnicity and original stop purpose'
                ),
                agencyName: chartState.data[AGENCY_DETAILS].name,
                chartTitle: getBarChartModalHeading(
                  'Contraband "Hit Rate" Grouped By Stop Purpose',
                  contrabandStopPurposeYear
                ),
              }}
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
          chartTitle='Contraband "Hit Rate" by type'
          handleViewData={() => setContrabandTypesData((state) => ({ ...state, isOpen: true }))}
        />
        <S.ChartDescription>
          <P>Shows what percentage of searches discovered specific types of illegal items.</P>
          <NewModal
            tableHeader='Contraband "Hit Rate" by type'
            tableSubheader="Shows what percentage of searches discovered specific types of illegal items."
            agencyName={chartState.data[AGENCY_DETAILS].name}
            tableData={contrabandTypesData.tableData}
            csvData={contrabandTypesData.csvData}
            columns={CONTRABAND_TYPES_TABLE_COLUMNS}
            tableDownloadName='Contraband "Hit Rate" by type'
            isOpen={contrabandTypesData.isOpen}
            closeModal={() => setContrabandTypesData((state) => ({ ...state, isOpen: false }))}
          />
        </S.ChartDescription>
        <S.ChartSubsection showCompare={showCompare}>
          <ChartWrapper>
            <HorizontalBarChart
              title='Contraband "Hit Rate" by type'
              data={contrabandTypesData}
              displayLegend={false}
              tooltipLabelCallback={formatTooltipValue}
              modalConfig={{
                tableHeader: 'Contraband "Hit Rate" by type',
                tableSubheader: getBarChartModalSubHeading(
                  'Shows what percentage of searches discovered specific types of illegal items'
                ),
                agencyName: chartState.data[AGENCY_DETAILS].name,
                chartTitle: getBarChartModalHeading(
                  'Contraband "Hit Rate" by type',
                  contrabandTypesYear
                ),
              }}
            />
          </ChartWrapper>
          <S.LegendSection>
            <DataSubsetPicker
              label="Year"
              value={contrabandTypesYear}
              onChange={handleContrabandTypesYearSelect}
              options={[YEARS_DEFAULT].concat(chartState.yearRange)}
              dropUp={!!showCompare}
            />
          </S.LegendSection>
        </S.ChartSubsection>
      </S.ChartSection>
      <S.ChartSection marginTop={5}>
        <ChartHeader
          chartTitle='Contraband "Hit Rate" by Type grouped by Stop Purpose'
          handleViewData={() =>
            setGroupedContrabandStopPurposeModalData((state) => ({ ...state, isOpen: true }))
          }
        />
        <S.ChartDescription>
          <P>
            Shows the specific types of illegal items discovered in searches by race and initial
            stop type.
          </P>
        </S.ChartDescription>
        <NewModal
          tableHeader='Contraband "Hit Rate" by Type grouped by Stop Purpose'
          tableSubheader="Shows the specific types of illegal items discovered in searches by race and initial stop type."
          agencyName={chartState.data[AGENCY_DETAILS].name}
          tableData={groupedContrabandStopPurposeModalData.tableData}
          csvData={groupedContrabandStopPurposeModalData.csvData}
          columns={CONTRABAND_TABLE_COLUMNS}
          tableDownloadName='Contraband "Hit Rate" by Type grouped by Stop Purpose'
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
              value={toTitleCase(selectedGroupedContrabandType)}
              onChange={handleGroupedContrabandTypeSelect}
              options={CONTRABAND_TYPES.map((c) => toTitleCase(c))}
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
              modalConfig={{
                tableHeader: 'Contraband "Hit Rate" by Type grouped by Safety Violation',
                tableSubheader: getBarChartModalSubHeading(
                  'Shows the specific types of illegal items discovered in searches by race and initial stop type'
                ),
                agencyName: chartState.data[AGENCY_DETAILS].name,
                chartTitle: getBarChartModalHeading(
                  'Contraband "Hit Rate" by Type grouped by Safety Violation',
                  year
                ),
              }}
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
              modalConfig={{
                tableHeader: 'Contraband "Hit Rate" by Type grouped by Regulatory/Equipment',
                tableSubheader: getBarChartModalSubHeading(
                  'Shows the specific types of illegal items discovered in searches by race and initial stop type'
                ),
                agencyName: chartState.data[AGENCY_DETAILS].name,
                chartTitle: getBarChartModalHeading(
                  'Contraband "Hit Rate" by Type grouped by Regulatory/Equipment',
                  year
                ),
              }}
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
              modalConfig={{
                tableHeader: 'Contraband "Hit Rate" by Type grouped by Other',
                tableSubheader: getBarChartModalSubHeading(
                  'Shows the specific types of illegal items discovered in searches by race and initial stop type'
                ),
                agencyName: chartState.data[AGENCY_DETAILS].name,
                chartTitle: getBarChartModalHeading(
                  'Contraband "Hit Rate" by Type grouped by Other',
                  year
                ),
              }}
            />
          </BarContainer>
        </HorizontalBarWrapper>
        <Legend
          heading="Show on graph:"
          keys={contrabandTypes}
          onKeySelect={handleContrabandKeySelected}
          showNonHispanic={false}
          legendColors="contrabandTypes"
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

const CONTRABAND_TYPES_TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year', // accessor is the "key" in the data
  },
  {
    Header: 'Alcohol*',
    accessor: 'alcohol',
  },
  {
    Header: 'Drugs*',
    accessor: 'drugs',
  },
  {
    Header: 'Money*',
    accessor: 'money',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Weapons*',
    accessor: 'weapons',
  },
  {
    Header: 'Total',
    accessor: 'total',
  },
];
