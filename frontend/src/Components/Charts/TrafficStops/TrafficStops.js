import React, { useState, useEffect } from 'react';
import TrafficStopsStyled, {
  GroupedStopsContainer,
  LineChartWithPieContainer,
  LineWrapper,
  PieContainer,
  PieStopsContainer,
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
  STATIC_LEGEND_KEYS,
  YEARS_DEFAULT,
  PURPOSE_DEFAULT,
  RACES,
  STOP_TYPES,
  RACE_TABLE_COLUMNS,
  STOP_REASON_TABLE_COLUMNS,
  STOP_PURPOSE_COLORS,
} from '../chartUtils';

// State
import useDataset, { STOPS_BY_REASON, STOPS, AGENCY_DETAILS } from '../../../Hooks/useDataset';

// Elements
import { P, WEIGHTS } from '../../../styles/StyledComponents/Typography';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Children
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
import Switch from 'react-switch';
import Checkbox from '../../Elements/Inputs/Checkbox';
import { pieChartConfig, pieChartLabels, pieColors } from '../../../util/setChartColors';
import VerticalBarChart from '../../NewCharts/VerticalBarChart';
import { ChartContainer } from '../ChartSections/ChartsCommon.styled';

function TrafficStops(props) {
  const { agencyId, showCompare, yearRange, year, yearIdx } = props;

  const theme = useTheme();
  const officerId = useOfficerId();

  const [stopsChartState] = useDataset(agencyId, STOPS);

  // TODO: Remove this when moving table modal data to new modal component
  useDataset(agencyId, STOPS_BY_REASON);

  useEffect(() => {
    if (window.location.hash) {
      document.querySelector(`${window.location.hash}`).scrollIntoView();
    }
  }, []);

  const [pickerActive, setPickerActive] = useState(null);

  const [purpose, setPurpose] = useState(PURPOSE_DEFAULT);

  // Don't include Average as that's only used in the Search Rate graph.
  const stopTypes = STOP_TYPES.filter((st) => st !== 'Average');

  const [percentageEthnicGroups] = useState(
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

  const [stopPurposeGroupsData, setStopPurposeGroups] = useState({
    labels: [],
    datasets: [],
    loading: true,
  });

  const purposeGroupedPieLabels = ['Safety Violation', 'Regulatory and Equipment', 'Other'];
  const purposeGroupedPieColors = [
    STOP_PURPOSE_COLORS.safteyViolation,
    STOP_PURPOSE_COLORS.regulatoryEquipment,
    STOP_PURPOSE_COLORS.other,
  ];
  const purposeGroupedPieConfig = {
    backgroundColor: purposeGroupedPieColors,
    borderColor: purposeGroupedPieColors,
    hoverBackgroundColor: purposeGroupedPieColors,
    borderWidth: 1,
  };
  const [stopPurposeGroupedPieData, setStopPurposeGroupedPieData] = useState({
    labels: purposeGroupedPieLabels,
    datasets: [
      {
        data: [],
        ...purposeGroupedPieConfig,
      },
    ],
  });

  const [stopsGroupedByPurposeData, setStopsGroupedByPurpose] = useState({
    labels: [],
    safety: { labels: [], datasets: [], loading: true },
    regulatory: { labels: [], datasets: [], loading: true },
    other: { labels: [], datasets: [], loading: true },
    max_step_size: null,
  });
  const groupedPieChartConfig = {
    backgroundColor: pieColors,
    borderColor: pieColors,
    hoverBackgroundColor: pieColors,
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
      loading: true,
    },
    regulatory: {
      labels: groupedPieChartLabels,
      datasets: [
        {
          data: [],
          ...groupedPieChartConfig,
        },
      ],
      loading: true,
    },
    other: {
      labels: groupedPieChartLabels,
      datasets: [
        {
          data: [],
          ...groupedPieChartConfig,
        },
      ],
      loading: true,
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
  const [checked, setChecked] = useState(false);

  const [trafficStopsByCountRange, setTrafficStopsByCountRange] = useState(null);
  const [trafficStopsByCountPurpose, setTrafficStopsByCountPurpose] = useState(0);
  const [trafficStopsByCountMinMaxYears, setTrafficStopsByCountMinMaxYears] = useState([
    null,
    null,
  ]);
  const initStopsByCount = {
    labels: [],
    datasets: [],
    loading: true,
  };
  const [trafficStopsByCount, setTrafficStopsByCount] = useState(initStopsByCount);

  const createDateForRange = (yr) =>
    Number.isInteger(yr) ? new Date(`${yr}-01-01`) : new Date(yr);

  const generateUrlParams = () => {
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
    if (officerId !== null) {
      params.push({ param: 'officer', val: officerId });
    }
    return params;
  };

  // Build Stops By Count
  useEffect(() => {
    setTrafficStopsByCount(initStopsByCount);
    const params = generateUrlParams();
    if (trafficStopsByCountPurpose !== 0) {
      params.push({ param: 'purpose', val: trafficStopsByCountPurpose });
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
    const params = generateUrlParams();
    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/stop-purpose-groups/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
        setStopPurposeGroups(res.data);
        buildStopPurposeGroupedPieData(res.data);
      })
      .catch((err) => console.log(err));
  }, [trafficStopsByCountRange]);

  const buildEthnicPercentages = (data, ds) => {
    if (!data.hasOwnProperty(ds)) return [0, 0, 0, 0, 0, 0];
    const dsTotal = data[ds].datasets
      .map((s) => s.data.reduce((a, b) => a + b, 0))
      .reduce((a, b) => a + b, 0);
    return data[ds].datasets.map((s) =>
      ((s.data.reduce((a, b) => a + b, 0) / dsTotal) * 100).toFixed(2)
    );
  };

  // Build Stops Grouped by Purpose
  useEffect(() => {
    const params = generateUrlParams();
    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/stops-grouped-by-purpose/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
        setStopsGroupedByPurpose(res.data);
      })
      .catch((err) => console.log(err));
  }, [trafficStopsByCountRange]);

  const [stopsByPercentageData, setStopsByPercentageData] = useState({
    labels: [],
    datasets: [],
    loading: true,
  });

  useEffect(() => {
    let url = `/api/agency/${agencyId}/stops-by-percentage/`;
    if (officerId !== null) {
      url = `${url}?officer=${officerId}`;
    }
    axios
      .get(url)
      .then((res) => {
        setStopsByPercentageData(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

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

  useEffect(() => {
    handleYearSelectForGroupedPieCharts();
    buildStopPurposeGroupedPieData(stopPurposeGroupsData);
  }, [stopsGroupedByPurposeData, year, yearIdx]);

  const buildStopPurposeGroupedPieData = (ds) => {
    const getValues = (arr) => {
      if (!yearIdx) {
        return arr.reduce((a, b) => a + b, 0);
      }
      // Reverse to match dropdown descending years
      return arr.toReversed()[yearIdx - 1] || 0;
    };

    const data = [];
    if (ds.labels && ds.labels.length) {
      const safety = getValues(ds.datasets[0].data);
      const regulatory = getValues(ds.datasets[1].data);
      const other = getValues(ds.datasets[2].data);
      const total = safety + regulatory + other;

      const normalize = (n) => ((n / total) * 100).toFixed(4);

      if (total > 0) {
        data.push(normalize(safety));
        data.push(normalize(regulatory));
        data.push(normalize(other));
      }
    }
    setStopPurposeGroupedPieData({
      labels: purposeGroupedPieLabels,
      datasets: [
        {
          data,
          ...purposeGroupedPieConfig,
        },
      ],
    });
  };

  // Handle stop purpose dropdown state
  const handleStopPurposeSelect = (p, i) => {
    if (p === purpose) return;
    setPurpose(p);
    setTrafficStopsByCountPurpose(i);
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
    openModal(STOPS, RACE_TABLE_COLUMNS);
  };

  const handleViewCountData = () => {
    openModal(STOPS_BY_REASON, STOP_REASON_TABLE_COLUMNS);
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
      return 'by this officer';
    }
    if (agencyId === '-1') {
      return 'for the entire state';
    }
    return 'by this department';
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

  const buildEthnicPercentagesForYear = (data, ds, idx = null) => {
    const dsTotal = data[ds].datasets.map((s) => s.data[idx]).reduce((a, b) => a + b, 0);
    return data[ds].datasets.map((s) => ((s.data[idx] / dsTotal) * 100 || 0).toFixed(2));
  };

  const handleYearSelectForGroupedPieCharts = () => {
    // Get the reverse index of the year since it's now in descending order
    let idxForYear = stopsGroupedByPurposeData.labels.length - yearIdx;
    if (idxForYear < 0) {
      idxForYear = null;
    }
    updateStoppedPurposePieChart(
      year === YEARS_DEFAULT
        ? buildEthnicPercentages(stopsGroupedByPurposeData, 'safety')
        : buildEthnicPercentagesForYear(stopsGroupedByPurposeData, 'safety', idxForYear),
      year === YEARS_DEFAULT
        ? buildEthnicPercentages(stopsGroupedByPurposeData, 'regulatory')
        : buildEthnicPercentagesForYear(stopsGroupedByPurposeData, 'regulatory', idxForYear),
      year === YEARS_DEFAULT
        ? buildEthnicPercentages(stopsGroupedByPurposeData, 'other')
        : buildEthnicPercentagesForYear(stopsGroupedByPurposeData, 'other', idxForYear)
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

  const pieChartTitle = () => {
    let subject = stopsChartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    return `Traffic Stops By Percentage for ${subject} ${
      year === YEARS_DEFAULT ? `since ${yearRange[yearRange.length - 1]}` : `in ${year}`
    }`;
  };

  const getPieChartModalSubHeading = (title, yr = null) => {
    const yearSelected = yr && yr !== 'All' ? ` in ${yr}` : '';
    return `${title} ${subjectObserving()}${yearSelected}.`;
  };

  const stopPurposeGroupPieChartTitle = () => {
    let subject = stopsChartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    return `Traffic Stops By Stop Purpose for ${subject} ${
      year === YEARS_DEFAULT ? `since ${stopsGroupedByPurposeData.labels[0]}` : `in ${year}`
    }`;
  };

  const getPieChartModalHeading = (stopPurpose) => {
    let subject = stopsChartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    return `Traffic Stops By ${stopPurpose} and Race Count for ${subject} ${
      year === YEARS_DEFAULT ? `since ${stopsGroupedByPurposeData.labels[0]}` : `in ${year}`
    }`;
  };

  const getLineChartModalSubHeading = (title, showStopPurpose = false) => {
    let stopPurposeSelected = '';
    if (showStopPurpose) {
      stopPurposeSelected =
        trafficStopsByCountPurpose && trafficStopsByCountPurpose !== 0 // All
          ? ` for ${STOP_TYPES[trafficStopsByCountPurpose - 1]}`
          : '';
    }
    return `${title} ${subjectObserving()}${stopPurposeSelected}.`;
  };

  const getLineChartModalHeading = (title, showStopPurpose = false) => {
    let subject = stopsChartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    let stopPurposeSelected = '';
    if (showStopPurpose) {
      stopPurposeSelected =
        trafficStopsByCountPurpose && trafficStopsByCountPurpose !== 0 // All
          ? ` for ${STOP_TYPES[trafficStopsByCountPurpose - 1]}`
          : '';
    }
    return `${title} by ${subject}${stopPurposeSelected} since ${trafficStopsByCount.labels[0]}`;
  };

  const formatTooltipValue = (ctx) => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(2)}%`;

  const stopsByPercentageModalTitle = () => {
    let subject = stopsChartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    return `Traffic Stops by Percentage for ${subject} since ${stopsByPercentageData.labels[0]}`;
  };

  return (
    <TrafficStopsStyled>
      {/* Traffic Stops by Percentage */}
      {renderMetaTags()}
      {renderTableModal()}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <MonthRangePicker
          deactivatePicker={pickerActive === null}
          onChange={updateStopsByCount}
          onClosePicker={closeStopsByCountRange}
          minY={trafficStopsByCountMinMaxYears[0]}
          maxY={trafficStopsByCountMinMaxYears[1]}
        />
      </div>
      <S.ChartSection>
        <ChartHeader
          chartTitle="Traffic Stops By Percentage"
          handleViewData={handleViewPercentageData}
        />
        <S.ChartDescription>
          <P>
            Shows the race/ethnic composition of drivers stopped {subjectObserving()} over time.
          </P>
          <P>{getChartDetailedBreakdown()}</P>
        </S.ChartDescription>
        <LineChartWithPieContainer showCompare={showCompare}>
          <ChartContainer override={{ width: '100%' }}>
            <VerticalBarChart
              title="Traffic Stops By Percentage"
              data={stopsByPercentageData}
              maintainAspectRatio={false}
              stacked
              disableLegend
              tooltipLabelCallback={formatTooltipValue}
              modalConfig={{
                tableHeader: 'Traffic Stops By Percentage',
                tableSubheader: `Shows the race/ethnic composition of drivers stopped ${subjectObserving()} over time.`,
                agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                chartTitle: stopsByPercentageModalTitle(),
              }}
            />
          </ChartContainer>

          <PieContainer>
            <PieChart
              data={byPercentagePieData}
              displayLegend={false}
              maintainAspectRatio
              modalConfig={{
                tableHeader: 'Traffic Stops By Percentage',
                tableSubheader: getPieChartModalSubHeading(
                  'Shows the race/ethnic composition of drivers stopped',
                  year
                ),
                agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                chartTitle: pieChartTitle(),
              }}
            />
          </PieContainer>
        </LineChartWithPieContainer>
      </S.ChartSection>
      {/* Traffic Stops by Count */}
      <S.ChartSection id="stops_by_count">
        <ChartHeader
          chartTitle="Traffic Stops By Count"
          handleViewData={handleViewCountData}
          shareProps={{
            graphAnchor: 'stops_by_count',
          }}
        />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>
        <S.ChartSubsection showCompare={props.showCompare}>
          <LineWrapper visible>
            <StopGroupsContainer>
              <LineChart
                data={trafficStopsByCount}
                title="Traffic Stops By Count"
                maintainAspectRatio={false}
                modalConfig={{
                  tableHeader: 'Traffic Stops By Count',
                  tableSubheader: getLineChartModalSubHeading(
                    'Shows the number of traffics stops broken down by purpose and race / ethnicity'
                  ),
                  agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                  chartTitle: getLineChartModalHeading('Traffic Stops By Count', true),
                }}
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
          </S.LegendBeside>
        </S.ChartSubsection>
      </S.ChartSection>
      <S.ChartSection id="stops_by_purpose">
        <ChartHeader
          chartTitle="Traffic Stops By Stop Purpose"
          handleViewData={showStopPurposeModal}
          shareProps={{
            graphAnchor: 'stops_by_purpose',
          }}
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
        <LineChartWithPieContainer showCompare={showCompare}>
          <ChartContainer override={{ width: '100%' }}>
            <LineChart
              data={stopPurposeGroupsData}
              title="Stop Purposes By Group"
              maintainAspectRatio={false}
              displayStopPurposeTooltips
              showLegendOnBottom={false}
              modalConfig={{
                tableHeader: 'Traffic Stops By Group',
                tableSubheader: getLineChartModalSubHeading(
                  'Shows the number of traffics stops broken down by purpose and race / ethnicity'
                ),
                agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                chartTitle: getLineChartModalHeading('Traffic Stops By Group'),
              }}
            />
          </ChartContainer>
          <PieContainer>
            <PieChart
              data={stopPurposeGroupedPieData}
              displayLegend={false}
              maintainAspectRatio
              modalConfig={{
                tableHeader: 'Traffic Stops By Stop Purpose',
                tableSubheader: getPieChartModalSubHeading(
                  'Shows the stop purpose and race/ethnic composition of drivers stopped',
                  year
                ),
                agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                chartTitle: stopPurposeGroupPieChartTitle(),
              }}
            />
          </PieContainer>
        </LineChartWithPieContainer>
      </S.ChartSection>
      <S.ChartSection marginTop={5} id="stops_by_purpose_and_count">
        <ChartHeader
          chartTitle="Traffic Stops By Stop Purpose and Race Count"
          handleViewData={showGroupedStopPurposeModal}
          shareProps={{
            graphAnchor: 'stops_by_purpose_and_count',
          }}
        />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>

        <NewModal
          tableHeader="Traffic Stops By Stop Purpose and Race Count"
          tableSubheader="Shows the number of traffics stops broken down by purpose and race / ethnicity"
          agencyName={stopsChartState.data[AGENCY_DETAILS].name}
          tableData={groupedStopPurposeModalData.tableData}
          csvData={groupedStopPurposeModalData.csvData}
          columns={RACE_TABLE_COLUMNS}
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
              modalConfig={{
                tableHeader: 'Traffic Stops By Stop Purpose and Race Count',
                tableSubheader: getLineChartModalSubHeading(
                  'Shows the number of traffics stops broken down by purpose and race / ethnicity'
                ),
                agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                chartTitle: getLineChartModalHeading('Traffic Stops Grouped By Safety Violation'),
              }}
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
              modalConfig={{
                tableHeader: 'Traffic Stops By Stop Purpose and Race Count',
                tableSubheader: getLineChartModalSubHeading(
                  'Shows the number of traffics stops broken down by purpose and race / ethnicity'
                ),
                agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                chartTitle: getLineChartModalHeading(
                  'Traffic Stops Grouped By Regulatory/Equipment'
                ),
              }}
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
              modalConfig={{
                tableHeader: 'Traffic Stops By Stop Purpose and Race Count',
                tableSubheader: getLineChartModalSubHeading(
                  'Shows the number of traffics stops broken down by purpose and race / ethnicity'
                ),
                agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                chartTitle: getLineChartModalHeading('Traffic Stops Grouped By Other'),
              }}
            />
          </GroupedStopsContainer>
        </LineWrapper>
        <PieWrapper visible={checked === true}>
          <PieStopsContainer visible={visibleStopsGroupedByPurpose[0].visible}>
            <PieWrapper visible>
              <PieChart
                data={stopsGroupedByPurposePieData.safety}
                title="Safety Violation"
                maintainAspectRatio={false}
                displayLegend={false}
                modalConfig={{
                  tableHeader: 'Traffic Stops By Stop Purpose and Race Count',
                  tableSubheader: getPieChartModalSubHeading(
                    'Shows the number of traffics stops broken down by purpose and race / ethnicity'
                  ),
                  agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                  chartTitle: getPieChartModalHeading('Safety Violation'),
                }}
              />
            </PieWrapper>
          </PieStopsContainer>
          <PieStopsContainer visible={visibleStopsGroupedByPurpose[1].visible}>
            <PieWrapper visible>
              <PieChart
                data={stopsGroupedByPurposePieData.regulatory}
                title="Regulatory/Equipment"
                maintainAspectRatio={false}
                displayLegend={false}
                modalConfig={{
                  tableHeader: 'Traffic Stops By Stop Purpose and Race Count',
                  tableSubheader: getPieChartModalSubHeading(
                    'Shows the number of traffics stops broken down by purpose and race / ethnicity'
                  ),
                  agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                  chartTitle: getPieChartModalHeading('Regulatory/Equipment'),
                }}
              />
            </PieWrapper>
          </PieStopsContainer>
          <PieStopsContainer visible={visibleStopsGroupedByPurpose[2].visible}>
            <PieWrapper visible>
              <PieChart
                data={stopsGroupedByPurposePieData.other}
                title="Other"
                maintainAspectRatio={false}
                displayLegend={false}
                modalConfig={{
                  tableHeader: 'Traffic Stops By Stop Purpose and Race Count',
                  tableSubheader: getPieChartModalSubHeading(
                    'Shows the number of traffics stops broken down by purpose and race / ethnicity'
                  ),
                  agencyName: stopsChartState.data[AGENCY_DETAILS].name,
                  chartTitle: getPieChartModalHeading('Other'),
                }}
              />
            </PieWrapper>
          </PieStopsContainer>
        </PieWrapper>

        <Legend
          heading={!checked ? 'Show on graph:' : 'Legend:'}
          keys={stopPurposeEthnicGroups}
          onKeySelect={handleStopPurposeKeySelected}
          showNonHispanic
          isStatic={checked}
        />
      </S.ChartSection>
    </TrafficStopsStyled>
  );
}

export default TrafficStops;

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
