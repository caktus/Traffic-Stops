import React, { useState, useEffect } from 'react';
import TrafficStopsStyled, {
  GroupedStopsContainer,
  LineWrapper,
  PieWrapper,
  StopGroupsContainer,
} from './TrafficStops.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';
import cloneDeep from 'lodash.clonedeep';

// Util
import {
  reduceFullDataset,
  calculatePercentage,
  calculateYearTotal,
  filterSinglePurpose,
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
import { P } from '../../../styles/StyledComponents/Typography';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Children
import Line from '../ChartPrimitives/Line';
import StackedBar from '../ChartPrimitives/StackedBar';
import Pie from '../ChartPrimitives/Pie';
import Legend from '../ChartSections/Legend/Legend';
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import toTitleCase from '../../../util/toTitleCase';
import useOfficerId from '../../../Hooks/useOfficerId';
import MonthRangePicker from '../../Elements/MonthRangePicker';
import mapDatasetKeyToEndpoint from '../../../Services/endpoints';
import range from 'lodash.range';
import LineChart from '../../NewCharts/LineChart';
import axios from '../../../Services/Axios';
import NewModal from '../../NewCharts/NewModal';
import displayDefinition from '../../../util/displayDefinition';
import PieChart from '../../NewCharts/PieChart';
import Switch from 'react-switch';

function TrafficStops(props) {
  const { agencyId } = props;

  const theme = useTheme();
  const officerId = useOfficerId();

  const [stopsChartState] = useDataset(agencyId, STOPS);
  const [reasonChartState] = useDataset(agencyId, STOPS_BY_REASON);

  const [pickerActive, setPickerActive] = useState(null);
  const [pickerXAxis, setPickerXAxis] = useState(null);
  const [forcePickerRerender, setForcePickerRerender] = useState(false);
  const [reasonChartYearSet, setReasonChartYearSet] = useState(reasonChartState.yearSet);

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
  const [countEthnicGroups, setCountEthnicGroups] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );
  const [stopPurposeEthnicGroups, setStopPurposeEthnicGroups] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [byPercentageLineData, setByPercentageLineData] = useState([]);
  const [byPercentagePieData, setByPercentagePieData] = useState([]);

  const [byCountLineData, setByCountLineData] = useState([]);

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

  // Build Stop Purpose Groups
  useEffect(() => {
    axios
      .get(`/api/agency/${agencyId}/stop-purpose-groups/`)
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
    axios
      .get(`/api/agency/${agencyId}/stops-grouped-by-purpose/`)
      .then((res) => {
        setStopsGroupedByPurpose(res.data);

        setStopsGroupedByPurposePieData({
          safety: {
            labels: groupedPieChartLabels,
            datasets: [
              {
                data: buildPercentages(res.data, 'safety'),
                ...groupedPieChartConfig,
              },
            ],
          },
          regulatory: {
            labels: groupedPieChartLabels,
            datasets: [
              {
                data: buildPercentages(res.data, 'regulatory'),
                ...groupedPieChartConfig,
              },
            ],
          },
          other: {
            labels: groupedPieChartLabels,
            datasets: [
              {
                data: buildPercentages(res.data, 'other'),
                ...groupedPieChartConfig,
              },
            ],
          },
        });
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
      if (!year || year === 'All') {
        setByPercentagePieData(reduceFullDataset(data, RACES, theme));
      } else {
        const yearData = data.find((d) => d.year === year);
        if (!yearData) {
          setByPercentagePieData([]);
        } else {
          const total = calculateYearTotal(yearData);
          setByPercentagePieData(
            RACES.map((race) => ({
              x: toTitleCase(race),
              y: calculatePercentage(yearData[race], total),
              color: theme.colors.ethnicGroup[race],
              fontColor: theme.colors.fontColorsByEthnicGroup[race],
            }))
          );
        }
      }
    }
  }, [stopsChartState.data[STOPS], year]);

  // Build data for Stops By Count line chart ("All")
  useEffect(() => {
    const data = reasonChartState.data[STOPS];
    if (data && purpose === PURPOSE_DEFAULT) {
      const derivedData = countEthnicGroups
        .filter((g) => g.selected)
        .map((r) => {
          const race = r.value;
          const rGroup = {
            id: race,
            color: theme.colors.ethnicGroup[race],
          };
          rGroup.data = data.map((d) => ({
            displayName: toTitleCase(race),
            // eslint-disable-next-line no-nested-ternary
            x: pickerActive !== null ? (pickerXAxis === 'Month' ? d.date : d.year) : d.year,
            y: d[race],
          }));
          return rGroup;
        });
      setByCountLineData(derivedData);
    }
  }, [reasonChartState.data[STOPS], purpose, countEthnicGroups, pickerActive]);

  // Build data for Stops By Count line chart (single purpose)
  useEffect(() => {
    const data = reasonChartState.data[STOPS_BY_REASON]?.stops;
    if (data && purpose !== PURPOSE_DEFAULT) {
      const purposeData = filterSinglePurpose(data, purpose);
      const derivedData = countEthnicGroups
        .filter((g) => g.selected)
        .map((r) => {
          const race = r.value;
          return {
            id: race,
            color: theme.colors.ethnicGroup[race],
            data: purposeData.map((d) => ({
              displayName: toTitleCase(race),
              // eslint-disable-next-line no-nested-ternary
              x: pickerActive !== null ? (pickerXAxis === 'Month' ? d.date : d.year) : d.year,
              y: d[race],
            })),
          };
        });
      setByCountLineData(derivedData);
    }
  }, [reasonChartState.data[STOPS_BY_REASON], purpose, countEthnicGroups, pickerActive]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  // Handle stop purpose dropdown state
  const handleStopPurposeSelect = async (p) => {
    if (p === purpose) return;
    if (p === PURPOSE_DEFAULT) {
      setPickerActive(null);
      // Reset the chart data
      const getEndpoint = mapDatasetKeyToEndpoint(STOPS);
      const { data } = await axios.get(getEndpoint(agencyId));
      reasonChartState.data[STOPS] = data;
      setReasonChartYearSet(range(2002, new Date().getFullYear() + 1, 2));
      setForcePickerRerender(false);
    } else if (pickerActive !== null) {
      setForcePickerRerender(true);
    }
    setPurpose(p);
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

  // Handle stops by count legend interactions
  const handleCountKeySelected = (ethnicGroup) => {
    const groupIndex = countEthnicGroups.indexOf(
      countEthnicGroups.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...countEthnicGroups];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setCountEthnicGroups(updatedGroups);
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
    setReasonChartYearSet(val.yearRange);
    if (purpose !== PURPOSE_DEFAULT) {
      reasonChartState.data[STOPS_BY_REASON] = val.data;
    } else {
      reasonChartState.data[STOPS] = val.data;
    }
    setPickerXAxis(val.xAxis);
    setPickerActive((oldVal) => (oldVal === null ? true : !oldVal));
  };

  const lineAxisFormat = (t) => {
    if (pickerActive !== null) {
      if (pickerXAxis === 'Month') {
        if (typeof t === 'string') {
          // Month label is YYYY-MM
          const month = new Date(t).getMonth() + 1;
          let datasetLength;
          if (purpose !== PURPOSE_DEFAULT) {
            datasetLength = reasonChartState.data[STOPS_BY_REASON]?.stops.length;
          } else {
            datasetLength = reasonChartState.data[STOPS].length;
          }
          if (datasetLength > 10 && datasetLength <= 15) {
            return month % 2 === 0 ? t : null;
          }
          if (datasetLength > 15) {
            return month % 3 === 0 ? t : null;
          }
        }

        return t;
      }
    }
    return t % 2 === 0 ? t : null;
  };

  const [checked, setChecked] = useState(false);
  const handleChange = (nextChecked) => {
    setChecked(nextChecked);
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
          <S.PieSection>
            <S.PieWrapper>
              <Pie data={byPercentagePieData} loading={stopsChartState.loading[STOPS]} />
            </S.PieWrapper>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelect}
              options={[YEARS_DEFAULT].concat(stopsChartState.yearRange)}
            />
          </S.PieSection>
        </S.ChartSubsection>
      </S.ChartSection>
      {/* Traffic Stops by Count */}
      <S.ChartSection>
        <ChartHeader chartTitle="Traffic Stops By Count" handleViewData={handleViewCountData} />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>
        <S.ChartSubsection showCompare={props.showCompare}>
          <S.LineWrapper>
            <Line
              data={byCountLineData}
              loading={reasonChartState.loading[STOPS_BY_REASON]}
              iTickFormat={lineAxisFormat}
              iTickValues={reasonChartYearSet}
              dAxisProps={{
                tickFormat: (t) => `${t}`,
              }}
              xAxisLabel={pickerActive !== null ? pickerXAxis : 'Year'}
            />
          </S.LineWrapper>
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
              agencyId={agencyId}
              dataSet={purpose !== PURPOSE_DEFAULT ? STOPS_BY_REASON : STOPS}
              deactivatePicker={pickerActive === null}
              forcePickerRerender={forcePickerRerender}
              onChange={updateStopsByCount}
              onClosePicker={() => setPickerActive(null)}
            />
            <S.Spacing>
              <Legend
                heading="Show on graph:"
                keys={countEthnicGroups}
                onKeySelect={handleCountKeySelected}
                showNonHispanic
              />
            </S.Spacing>
          </S.LegendBeside>
        </S.ChartSubsection>
      </S.ChartSection>
      <S.ChartSection>
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
            />
          </StopGroupsContainer>
        </LineWrapper>
      </S.ChartSection>
      <S.ChartSection>
        <ChartHeader
          chartTitle="Traffic Stops By Stop Purpose and Race Count"
          handleViewData={showGroupedStopPurposeModal}
        />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>
        <Legend
          heading="Show on graph:"
          keys={stopPurposeEthnicGroups}
          onKeySelect={handleStopPurposeKeySelected}
          showNonHispanic
          row
        />
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '10px',
            marginTop: '10px',
            marginBottom: '10px',
          }}
        >
          <span>Switch to {checked ? 'line' : 'pie'} charts</span>
          <Switch onChange={handleChange} checked={checked} className="react-switch" />
        </div>
        <LineWrapper visible={checked === false}>
          <GroupedStopsContainer>
            <LineChart
              data={stopsGroupedByPurposeData.safety}
              title="Safety Violation"
              maintainAspectRatio={false}
              displayLegend={false}
              yAxisMax={stopsGroupedByPurposeData.max_step_size}
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer>
            <LineChart
              data={stopsGroupedByPurposeData.regulatory}
              title="Regulatory/Equipment"
              maintainAspectRatio={false}
              displayLegend={false}
              yAxisMax={stopsGroupedByPurposeData.max_step_size}
              yAxisShowLabels={false}
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer>
            <LineChart
              data={stopsGroupedByPurposeData.other}
              title="Other"
              maintainAspectRatio={false}
              displayLegend={false}
              yAxisMax={stopsGroupedByPurposeData.max_step_size}
              yAxisShowLabels={false}
            />
          </GroupedStopsContainer>
        </LineWrapper>
        <PieWrapper visible={checked === true}>
          <GroupedStopsContainer>
            <PieChart
              data={stopsGroupedByPurposePieData.safety}
              title="Safety Violation"
              maintainAspectRatio={false}
              displayLegend={false}
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer>
            <PieChart
              data={stopsGroupedByPurposePieData.regulatory}
              title="Regulatory/Equipment"
              maintainAspectRatio={false}
              displayLegend={false}
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer>
            <PieChart
              data={stopsGroupedByPurposePieData.other}
              title="Other"
              maintainAspectRatio={false}
              displayLegend={false}
            />
          </GroupedStopsContainer>
        </PieWrapper>
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
