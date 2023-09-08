import React, { useState, useEffect, useRef } from 'react';
import TrafficStopsStyled, {
  GroupedStopsContainer,
  LineWrapper,
  PieWrapper,
  StopGroupsContainer,
  SwitchContainer,
} from './TrafficStops.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';
import cloneDeep from 'lodash.clonedeep';

// Util
import {
  reduceFullDataset,
  calculatePercentage,
  calculateYearTotal,
  buildStackedBarData,
  STATIC_LEGEND_KEYS,
  YEARS_DEFAULT,
  PURPOSE_DEFAULT,
  RACES,
  STOP_TYPES,
} from '../chartUtils';

// State
import useDataset, { STOPS_BY_REASON, STOPS, AGENCY_DETAILS } from '../../../Hooks/useDataset';

// Elements
import { P, WEIGHTS } from '../../../styles/StyledComponents/Typography';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Children
import StackedBar from '../ChartPrimitives/StackedBar';
import Legend from '../ChartSections/Legend/Legend';
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import useOfficerId from '../../../Hooks/useOfficerId';
import MonthRangePicker from '../../Elements/MonthRangePicker';
import LineChart from '../../NewCharts/LineChart';
import axios from '../../../Services/Axios';
import NewModal from '../../NewCharts/NewModal';
import displayDefinition from '../../../util/displayDefinition';
import PieChart from '../../NewCharts/PieChart';
import ChartModal from '../../NewCharts/ChartModal';
import Button from '../../Elements/Button';
import Switch from 'react-switch';
import Checkbox from '../../Elements/Inputs/Checkbox';

function TrafficStops(props) {
  const { agencyId } = props;

  const theme = useTheme();
  const officerId = useOfficerId();

  const [stopsChartState] = useDataset(agencyId, STOPS);

  // TODO: Remove this when moving table modal data to new modal component
  useDataset(agencyId, STOPS_BY_REASON);

  const [pickerActive, setPickerActive] = useState(null);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const [purpose, setPurpose] = useState(PURPOSE_DEFAULT);

  // Don't include Average as that's only used in the Search Rate graph.
  const stopTypes = STOP_TYPES.filter((st) => st !== 'Average');

  const [percentageEthnicGroups, setPercentageEthnicGroups] = useState(
    /* I sure wish I understood with certainty why this is necessary. Here's what I know:
      - Setting both of these states to STATIC_LEGEND_KEYS cause calling either setState function
      to mutate both states.
      - If I set initial state to STATIC_LEGEND_KEYS.slice() or [...STATIC_LEGEND_KEYS],
      the problem remains.
      - Indeed, if I set it to STATIC_LEGEND_KEYS.map(k => k), it persists.
      - Only when I make a copy of the objects inside the list do the states update
      independently.
      Conslusion is that React must make shallow copies of initalState, leaving pointers
      to deeper variables in tact. The result here is that, while we may have separate
      instances of STATIC_LEGEND_KEYS in state, the pointers to the keys in its objects
      are the same-- updating one state updates the other.
    */
    () => STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );
  const [stopPurposeEthnicGroups, setStopPurposeEthnicGroups] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [byPercentageLineData, setByPercentageLineData] = useState([]);
  const pieChartLabels = ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'];
  const pieChartConfig = {
    backgroundColor: ['#80d9d8', '#beb4fa', '#ca8794', '#ffeeb2', '#8598ac', '#cab6c7'],
    borderColor: ['#02bcbb', '#8879fc', '#9c0f2e', '#ffe066', '#0c3a66', '#9e7b9b'],
    borderWidth: 1,
  };
  const [byPercentagePieData, setByPercentagePieData] = useState({
    labels: pieChartLabels,
    datasets: [
      {
        data: [],
        ...pieChartConfig,
      },
    ],
  });

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

  const [stopPurposeGroupsData, setStopPurposeGroups] = useState({ labels: [], datasets: [] });
  const [stopsGroupedByPurposeData, setStopsGroupedByPurpose] = useState({
    labels: [],
    safety: { labels: [], datasets: [] },
    regulatory: { labels: [], datasets: [] },
    other: { labels: [], datasets: [] },
    max_step_size: null,
  });
  const groupedPieChartConfig = {
    backgroundColor: ['#80d9d8', '#beb4fa', '#ca8794', '#ffeeb2', '#8598ac', '#cab6c7'],
    borderColor: ['#02bcbb', '#8879fc', '#9c0f2e', '#ffe066', '#0c3a66', '#9e7b9b'],
    borderWidth: 1,
  };
  const groupedPieChartLabels = ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'];
  const [stopsGroupedByPurposePieData, setStopsGroupedByPurposePieData] = useState({
    safety: {
      labels: groupedPieChartLabels,
      datasets: [
        {
          data: [],
          ...groupedPieChartConfig,
        },
      ],
    },
    regulatory: {
      labels: groupedPieChartLabels,
      datasets: [
        {
          data: [],
          ...groupedPieChartConfig,
        },
      ],
    },
    other: {
      labels: groupedPieChartLabels,
      datasets: [
        {
          data: [],
          ...groupedPieChartConfig,
        },
      ],
    },
  });

  const [visibleStopsGroupedByPurpose, setVisibleStopsGroupedByPurpose] = useState([
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

  const [stopPurposeModalData, setStopPurposeModalData] = useState({
    isOpen: false,
    tableData: [],
    csvData: [],
  });

  const [groupedStopPurposeModalData, setGroupedStopPurposeModalData] = useState({
    isOpen: false,
    tableData: [],
    csvData: [],
    selectedPurpose: 'Safety Violation',
    purposeTypes: ['Safety Violation', 'Regulatory and Equipment', 'Other'],
  });
  const [yearForGroupedPieCharts, setYearForGroupedPieCharts] = useState('All');
  const [checked, setChecked] = useState(false);

  const [showZoomedPieChart, setShowZoomedPieChart] = useState(false);
  const zoomedPieCharRef = useRef(null);

  const [trafficStopsByCountRange, setTrafficStopsByCountRange] = useState(null);
  const [trafficStopsByCountPurpose, setTrafficStopsByCountPurpose] = useState(0);
  const [trafficStopsByCountMinMaxYears, setTrafficStopsByCountMinMaxYears] = useState([
    null,
    null,
  ]);
  const [trafficStopsByCount, setTrafficStopsByCount] = useState({
    labels: [],
    datasets: [],
  });

  const createDateForRange = (yr) =>
    Number.isInteger(yr) ? new Date(`${yr}-01-01`) : new Date(yr);

  // Build Stops By Count
  useEffect(() => {
    const params = [];
    if (trafficStopsByCountRange !== null) {
      const _from = `${trafficStopsByCountRange.from.year}-${trafficStopsByCountRange.from.month
        .toString()
        .padStart(2, 0)}-01`;
      const _to = `${trafficStopsByCountRange.to.year}-${trafficStopsByCountRange.to.month
        .toString()
        .padStart(2, 0)}-01`;
      params.push({ param: 'from', val: _from });
      params.push({ param: 'to', val: _to });
    }
    if (trafficStopsByCountPurpose !== 0) {
      params.push({ param: 'purpose', val: trafficStopsByCountPurpose });
    }
    if (officerId !== null) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/stops-by-count/?${urlParams}`;

    axios
      .get(url)
      .then((res) => {
        setTrafficStopsByCount(res.data);

        const years = res.data.labels;
        if (trafficStopsByCountMinMaxYears[0] === null) {
          setTrafficStopsByCountMinMaxYears([
            createDateForRange(years[0]),
            createDateForRange(years[years.length - 1] + 1),
          ]);
        }
      })
      .catch((err) => console.log(err));
  }, [trafficStopsByCountPurpose, trafficStopsByCountRange]);

  // Build Stop Purpose Groups
  useEffect(() => {
    let url = `/api/agency/${agencyId}/stop-purpose-groups/`;
    if (officerId !== null) {
      url = `${url}?officer=${officerId}`;
    }
    axios
      .get(url)
      .then((res) => {
        setStopPurposeGroups(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  const buildPercentages = (data, ds) => {
    const dsTotal = data[ds].datasets
      .map((s) => s.data.reduce((a, b) => a + b, 0))
      .reduce((a, b) => a + b, 0);
    return data[ds].datasets.map((s) =>
      ((s.data.reduce((a, b) => a + b, 0) / dsTotal) * 100).toFixed(2)
    );
  };

  // Build Stops Grouped by Purpose
  useEffect(() => {
    let url = `/api/agency/${agencyId}/stops-grouped-by-purpose/`;
    if (officerId !== null) {
      url = `${url}?officer=${officerId}`;
    }
    axios
      .get(url)
      .then((res) => {
        setStopsGroupedByPurpose(res.data);
        updateStoppedPurposePieChart(
          buildPercentages(res.data, 'safety'),
          buildPercentages(res.data, 'regulatory'),
          buildPercentages(res.data, 'other')
        );
      })
      .catch((err) => console.log(err));
  }, []);

  /* CALCULATE AND BUILD CHART DATA */
  // Build data for Stops by Percentage line chart
  useEffect(() => {
    const data = stopsChartState.data[STOPS];
    if (data && pickerActive === null) {
      const filteredGroups = percentageEthnicGroups.filter((g) => g.selected).map((g) => g.value);
      const derivedData = buildStackedBarData(data, filteredGroups, theme);
      setByPercentageLineData(derivedData);
    }
  }, [stopsChartState.data[STOPS], percentageEthnicGroups]);

  // Build data for Stops by Percentage pie chart
  useEffect(() => {
    const data = stopsChartState.data[STOPS];
    if (data) {
      let chartData = [0, 0, 0, 0, 0, 0];
      if (!year || year === 'All') {
        chartData = reduceFullDataset(data, RACES, theme).map((ds) => ds.y);
      } else {
        const yearData = data.find((d) => d.year === year);
        if (yearData) {
          const total = calculateYearTotal(yearData);
          chartData = RACES.map((race) => calculatePercentage(yearData[race], total));
        }
      }
      setByPercentagePieData({
        labels: pieChartLabels,
        datasets: [
          {
            data: chartData,
            ...pieChartConfig,
          },
        ],
      });
    }
  }, [stopsChartState.data[STOPS], year]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  // Handle stop purpose dropdown state
  const handleStopPurposeSelect = (p, i) => {
    if (p === purpose) return;
    setPurpose(p);
    setTrafficStopsByCountPurpose(i);
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

  // Handle stops grouped by purpose legend interactions
  const handleStopPurposeKeySelected = (ethnicGroup) => {
    const groupIndex = stopPurposeEthnicGroups.indexOf(
      stopPurposeEthnicGroups.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...stopPurposeEthnicGroups];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setStopPurposeEthnicGroups(updatedGroups);

    const newStopPurposeState = cloneDeep(stopsGroupedByPurposeData);
    newStopPurposeState.safety.datasets.forEach((s) => {
      // eslint-disable-next-line no-param-reassign
      s.hidden = !updatedGroups.find((g) => g.label === s.label).selected;
    });
    newStopPurposeState.regulatory.datasets.forEach((r) => {
      // eslint-disable-next-line no-param-reassign
      r.hidden = !updatedGroups.find((g) => g.label === r.label).selected;
    });
    newStopPurposeState.other.datasets.forEach((i) => {
      // eslint-disable-next-line no-param-reassign
      i.hidden = !updatedGroups.find((g) => g.label === i.label).selected;
    });
    setStopsGroupedByPurpose(newStopPurposeState);
  };

  const handleViewPercentageData = () => {
    setPurpose(PURPOSE_DEFAULT);
    openModal(STOPS, STOPS_TABLE_COLUMNS);
  };

  const handleViewCountData = () => {
    openModal(STOPS_BY_REASON, BY_REASON_TABLE_COLUMNS);
  };

  const showStopPurposeModal = () => {
    const tableData = [];
    stopPurposeGroupsData.labels.forEach((e, i) => {
      const safety = stopPurposeGroupsData.datasets[0].data[i];
      const regulatory = stopPurposeGroupsData.datasets[1].data[i];
      const other = stopPurposeGroupsData.datasets[2].data[i];
      tableData.unshift({
        year: e,
        safety,
        regulatory,
        other,
        total: [safety, regulatory, other].reduce((a, b) => a + b, 0),
      });
    });
    const newState = {
      isOpen: true,
      tableData,
      csvData: tableData,
    };
    setStopPurposeModalData(newState);
  };

  const showGroupedStopPurposeModal = (stopPurpose = 'Safety Violation') => {
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
    stopsGroupedByPurposeData.labels.forEach((e, y) => {
      const races = ['white', 'black', 'hispanic', 'asian', 'native_american', 'other'];
      const row = {
        year: e,
      };
      const total = [];
      races.forEach((r, j) => {
        // The data is indexed by the stop purpose group, then the index of the race then the index of the year.
        row[r] =
          stopsGroupedByPurposeData[stopPurposeKey[stopPurposeSelected]].datasets[j]['data'][y];
        total.unshift(row[r]);
      });
      row['total'] = total.reduce((a, b) => a + b, 0);
      tableData.unshift(row);
    });
    const newState = {
      ...groupedStopPurposeModalData,
      isOpen: true,
      tableData,
      csvData: tableData,
      selectedPurpose: stopPurposeSelected,
    };
    setGroupedStopPurposeModalData(newState);
  };

  const getChartDetailedBreakdown = () => {
    const selectedGroups = percentageEthnicGroups.filter((k) => k.selected).map((k) => k.label);
    if (selectedGroups.length < percentageEthnicGroups.length) {
      return `Showing total for ${selectedGroups.join(', ')}.`;
    }
    return '';
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

  const updateStopsByCount = (val) => {
    setTrafficStopsByCountRange(val);
  };
  const closeStopsByCountRange = () => {
    setPickerActive(null);
    setTrafficStopsByCountRange(null);
  };

  const handleChange = (nextChecked) => {
    setChecked(nextChecked);
  };

  const buildPercentagesForYear = (data, ds, idx = null) => {
    const dsTotal = data[ds].datasets.map((s) => s.data[idx]).reduce((a, b) => a + b, 0);
    return data[ds].datasets.map((s) => ((s.data[idx] / dsTotal) * 100 || 0).toFixed(2));
  };

  const handleYearSelectForGroupedPieCharts = (selectedYear, idx) => {
    setYearForGroupedPieCharts(selectedYear);
    const idxForYear = idx - 1; // Dropdown has first index as 'all' which we need to skip
    updateStoppedPurposePieChart(
      selectedYear === YEARS_DEFAULT
        ? buildPercentages(stopsGroupedByPurposeData, 'safety')
        : buildPercentagesForYear(stopsGroupedByPurposeData, 'safety', idxForYear),
      selectedYear === YEARS_DEFAULT
        ? buildPercentages(stopsGroupedByPurposeData, 'regulatory')
        : buildPercentagesForYear(stopsGroupedByPurposeData, 'regulatory', idxForYear),
      selectedYear === YEARS_DEFAULT
        ? buildPercentages(stopsGroupedByPurposeData, 'other')
        : buildPercentagesForYear(stopsGroupedByPurposeData, 'other', idxForYear)
    );
  };

  const updateStoppedPurposePieChart = (safety, regulatory, other) => {
    setStopsGroupedByPurposePieData({
      safety: {
        labels: groupedPieChartLabels,
        datasets: [
          {
            data: safety,
            ...groupedPieChartConfig,
          },
        ],
      },
      regulatory: {
        labels: groupedPieChartLabels,
        datasets: [
          {
            data: regulatory,
            ...groupedPieChartConfig,
          },
        ],
      },
      other: {
        labels: groupedPieChartLabels,
        datasets: [
          {
            data: other,
            ...groupedPieChartConfig,
          },
        ],
      },
    });
  };

  const toggleGroupedPurposeGraphs = (key) => {
    const toggleState = visibleStopsGroupedByPurpose;
    const toggleGraph = toggleState.find((v) => v.key === key);
    const otherGraphs = toggleState.filter((v) => v.key !== key);

    setVisibleStopsGroupedByPurpose(
      [
        ...otherGraphs,
        { key, visible: !toggleGraph.visible, title: toggleGraph.title, order: toggleGraph.order },
      ].sort(
        // eslint-disable-next-line no-nested-ternary
        (a, b) => (a.order < b.order ? (a.order === b.order ? 0 : -1) : 1)
      )
    );
  };

  const pieChartTitle = (download = false) => {
    let subject = stopsChartState.data[AGENCY_DETAILS].name;
    if (subjectObserving() === 'officer') {
      subject = `Officer ${officerId}`;
    }
    let title = `Traffic Stops By Percentage for ${subject} ${
      year === YEARS_DEFAULT ? `since ${stopsChartState.yearRange[0]}` : `during ${year}`
    }`;
    if (download) {
      title = `${title.split(' ').join('_').toLowerCase()}.png`;
    }
    return title;
  };

  return (
    <TrafficStopsStyled>
      {/* Traffic Stops by Percentage */}
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader
          chartTitle="Traffic Stops By Percentage"
          handleViewData={handleViewPercentageData}
        />
        <S.ChartDescription>
          <P>
            Shows the race/ethnic composition of drivers stopped by this {subjectObserving()} over
            time.
          </P>
          <P>{getChartDetailedBreakdown()}</P>
        </S.ChartDescription>
        <S.ChartSubsection showCompare={props.showCompare}>
          <S.LineSection>
            <S.LineWrapper>
              <StackedBar
                horizontal
                data={byPercentageLineData}
                tickValues={stopsChartState.yearSet}
                loading={stopsChartState.loading[STOPS]}
                yAxisLabel={(val) => `${val}%`}
              />
            </S.LineWrapper>
            <S.LegendBeside>
              <Legend
                heading="Show on graph:"
                keys={percentageEthnicGroups}
                onKeySelect={handlePercentageKeySelected}
                showNonHispanic
                row={!props.showCompare}
              />
            </S.LegendBeside>
          </S.LineSection>
          <ChartModal
            tableHeader="Traffic Stops By Percentage"
            tableSubheader={`Shows the race/ethnic composition of drivers stopped by this ${subjectObserving()} over time.`}
            agencyName={stopsChartState.data[AGENCY_DETAILS].name}
            isOpen={showZoomedPieChart}
            closeModal={() => setShowZoomedPieChart(false)}
            chartToPrintRef={zoomedPieCharRef}
            fileName={pieChartTitle(true)}
          >
            <S.PieSection zoomed>
              <S.PieWrapper zoomed>
                <PieChart
                  data={byPercentagePieData}
                  title={pieChartTitle()}
                  displayTitle
                  displayLegend
                  displayOutlabels
                  maintainAspectRatio
                  chartRef={zoomedPieCharRef}
                />
              </S.PieWrapper>
            </S.PieSection>
          </ChartModal>

          <S.PieSection alignItems="start">
            <S.PieWrapper>
              <PieChart
                data={byPercentagePieData}
                displayTitle
                displayLegend={false}
                maintainAspectRatio
              />
            </S.PieWrapper>
            <S.PieActionsWrapper>
              <DataSubsetPicker
                label="Year"
                value={year}
                onChange={handleYearSelect}
                options={[YEARS_DEFAULT].concat(stopsChartState.yearRange)}
              />
              <div
                style={{
                  marginTop: '1em',
                }}
              >
                <Button onClick={() => setShowZoomedPieChart(true)}>View more</Button>
              </div>
            </S.PieActionsWrapper>
          </S.PieSection>
        </S.ChartSubsection>
      </S.ChartSection>
      {/* Traffic Stops by Count */}
      <S.ChartSection>
        <ChartHeader chartTitle="Traffic Stops By Count" handleViewData={handleViewCountData} />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>
        <S.ChartSubsection showCompare={props.showCompare}>
          <LineWrapper visible>
            <StopGroupsContainer>
              <LineChart
                data={trafficStopsByCount}
                title="Traffic Stops By Count"
                maintainAspectRatio={false}
              />
            </StopGroupsContainer>
          </LineWrapper>
          <S.LegendBeside>
            <DataSubsetPicker
              label="Stop Purpose"
              value={purpose}
              onChange={handleStopPurposeSelect}
              options={[PURPOSE_DEFAULT].concat(stopTypes)}
            />

            {purpose !== PURPOSE_DEFAULT && (
              <p style={{ marginTop: '10px' }}>{displayDefinition(purpose)}</p>
            )}

            <MonthRangePicker
              deactivatePicker={pickerActive === null}
              onChange={updateStopsByCount}
              onClosePicker={closeStopsByCountRange}
              minY={trafficStopsByCountMinMaxYears[0]}
              maxY={trafficStopsByCountMinMaxYears[1]}
            />
          </S.LegendBeside>
        </S.ChartSubsection>
      </S.ChartSection>
      <S.ChartSection marginTop={5}>
        <ChartHeader
          chartTitle="Traffic Stops By Stop Purpose"
          handleViewData={showStopPurposeModal}
        />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>
        <NewModal
          tableHeader="Traffic Stops By Stop Purpose"
          tableSubheader="Shows the number of traffics stops broken down by purpose and race / ethnicity."
          agencyName={stopsChartState.data[AGENCY_DETAILS].name}
          tableData={stopPurposeModalData.tableData}
          csvData={stopPurposeModalData.csvData}
          columns={STOP_PURPOSE_TABLE_COLUMNS}
          tableDownloadName="Traffic Stops By Stop Purpose"
          isOpen={stopPurposeModalData.isOpen}
          closeModal={() => setStopPurposeModalData((state) => ({ ...state, isOpen: false }))}
        />
        <LineWrapper visible>
          <StopGroupsContainer>
            <LineChart
              data={stopPurposeGroupsData}
              title="Stop Purposes By Group"
              maintainAspectRatio={false}
              displayStopPurposeTooltips
              showLegendOnBottom={false}
            />
          </StopGroupsContainer>
        </LineWrapper>
      </S.ChartSection>
      <S.ChartSection marginTop={5}>
        <ChartHeader
          chartTitle="Traffic Stops By Stop Purpose and Race Count"
          handleViewData={showGroupedStopPurposeModal}
        />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>

        <NewModal
          tableHeader="Traffic Stops By Stop Purpose and Race Count"
          tableSubheader="Shows the number of traffics stops broken down by purpose and race / ethnicity"
          agencyName={stopsChartState.data[AGENCY_DETAILS].name}
          tableData={groupedStopPurposeModalData.tableData}
          csvData={groupedStopPurposeModalData.csvData}
          columns={GROUPED_STOP_PURPOSE_TABLE_COLUMNS}
          tableDownloadName={`Traffic Stops By Stop Purpose and Race Count - ${groupedStopPurposeModalData.selectedPurpose}`}
          isOpen={groupedStopPurposeModalData.isOpen}
          closeModal={() =>
            setGroupedStopPurposeModalData((state) => ({ ...state, isOpen: false }))
          }
        >
          <DataSubsetPicker
            label="Stop Purpose"
            value={groupedStopPurposeModalData.selectedPurpose}
            onChange={showGroupedStopPurposeModal}
            options={groupedStopPurposeModalData.purposeTypes}
          />
        </NewModal>
        <SwitchContainer>
          <span>Switch to {checked ? 'line' : 'pie'} charts</span>
          <Switch onChange={handleChange} checked={checked} className="react-switch" />
        </SwitchContainer>
        <div style={{ marginTop: '1em' }}>
          <P weight={WEIGHTS[1]}>Toggle graphs:</P>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'row', flexWrap: 'wrap' }}>
            {visibleStopsGroupedByPurpose.map((vg, i) => (
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
        <LineWrapper visible={checked === false}>
          <GroupedStopsContainer visible={visibleStopsGroupedByPurpose[0].visible}>
            <LineChart
              data={stopsGroupedByPurposeData.safety}
              title="Safety Violation"
              maintainAspectRatio={false}
              displayLegend={false}
              yAxisMax={stopsGroupedByPurposeData.max_step_size}
              redraw
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer visible={visibleStopsGroupedByPurpose[1].visible}>
            <LineChart
              data={stopsGroupedByPurposeData.regulatory}
              title="Regulatory/Equipment"
              maintainAspectRatio={false}
              displayLegend={false}
              yAxisMax={stopsGroupedByPurposeData.max_step_size}
              yAxisShowLabels={!visibleStopsGroupedByPurpose[0].visible}
              redraw
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer visible={visibleStopsGroupedByPurpose[2].visible}>
            <LineChart
              data={stopsGroupedByPurposeData.other}
              title="Other"
              maintainAspectRatio={false}
              displayLegend={false}
              yAxisMax={stopsGroupedByPurposeData.max_step_size}
              yAxisShowLabels={
                !visibleStopsGroupedByPurpose[0].visible && !visibleStopsGroupedByPurpose[1].visible
              }
              redraw
            />
          </GroupedStopsContainer>
        </LineWrapper>
        {checked && (
          <DataSubsetPicker
            label="Year"
            value={yearForGroupedPieCharts}
            onChange={handleYearSelectForGroupedPieCharts}
            options={[YEARS_DEFAULT].concat(stopsGroupedByPurposeData.labels)}
          />
        )}
        <PieWrapper visible={checked === true}>
          <GroupedStopsContainer visible={visibleStopsGroupedByPurpose[0].visible}>
            <PieChart
              data={stopsGroupedByPurposePieData.safety}
              title="Safety Violation"
              maintainAspectRatio={false}
              displayLegend={false}
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer visible={visibleStopsGroupedByPurpose[1].visible}>
            <PieChart
              data={stopsGroupedByPurposePieData.regulatory}
              title="Regulatory/Equipment"
              maintainAspectRatio={false}
              displayLegend={false}
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer visible={visibleStopsGroupedByPurpose[2].visible}>
            <PieChart
              data={stopsGroupedByPurposePieData.other}
              title="Other"
              maintainAspectRatio={false}
              displayLegend={false}
            />
          </GroupedStopsContainer>
        </PieWrapper>

        <Legend
          heading={!checked ? 'Show on graph:' : 'Legend:'}
          keys={stopPurposeEthnicGroups}
          onKeySelect={handleStopPurposeKeySelected}
          showNonHispanic
          row
          isStatic={checked}
        />
      </S.ChartSection>
    </TrafficStopsStyled>
  );
}

export default TrafficStops;

const STOPS_TABLE_COLUMNS = [
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

const BY_REASON_TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year',
  },
  {
    Header: 'Stop-reason',
    accessor: 'purpose',
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

const STOP_PURPOSE_TABLE_COLUMNS = [
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

const GROUPED_STOP_PURPOSE_TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year',
  },
  {
    Header: 'White',
    accessor: 'white',
  },
  {
    Header: 'Black',
    accessor: 'black',
  },
  {
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
  {
    Header: 'Asian',
    accessor: 'asian',
  },
  {
    Header: 'Native American',
    accessor: 'native_american',
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
