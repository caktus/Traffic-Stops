import React, { useState, useEffect } from 'react';
import TrafficStopsStyled, {
  GroupedStopsContainer,
  LineWrapper,
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
import useDataset, { STOPS_BY_REASON, STOPS } from '../../../Hooks/useDataset';

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
import LineChart from '../../NewCharts/LineChart';
import axios from '../../../Services/Axios';
import NewModal from '../../NewCharts/NewModal';

function TrafficStops(props) {
  const { agencyId } = props;

  const theme = useTheme();
  const officerId = useOfficerId();

  const [stopsChartState] = useDataset(agencyId, STOPS);
  const [reasonChartState] = useDataset(agencyId, STOPS_BY_REASON);

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
    safety: { labels: [], datasets: [] },
    regulatory: { labels: [], datasets: [] },
    investigatory: { labels: [], datasets: [] },
    max_step_size: null,
  });

  const [stopPurposeModalData, setStopPurposeModalData] = useState({
    isOpen: false,
    tableData: [],
    csvData: [],
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

  // Build Stops Grouped by Purpose
  useEffect(() => {
    axios
      .get(`/api/agency/${agencyId}/stops-grouped-by-purpose/`)
      .then((res) => {
        setStopsGroupedByPurpose(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  /* CALCULATE AND BUILD CHART DATA */
  // Build data for Stops by Percentage line chart
  useEffect(() => {
    const data = stopsChartState.data[STOPS];
    if (data) {
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
    const data = stopsChartState.data[STOPS];
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
            x: d.year,
            y: d[race],
          }));
          return rGroup;
        });
      setByCountLineData(derivedData);
    }
  }, [stopsChartState.data[STOPS], purpose, countEthnicGroups]);

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
              x: d.year,
              y: d[race],
            })),
          };
        });
      setByCountLineData(derivedData);
    }
  }, [reasonChartState.data[STOPS_BY_REASON], purpose, countEthnicGroups]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  // Handle stop purpose dropdown state
  const handleStopPurposeSelect = (p) => {
    if (p === purpose) return;
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
    newStopPurposeState.investigatory.datasets.forEach((i) => {
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
      const investigatory = stopPurposeGroupsData.datasets[2].data[i];
      tableData.unshift({
        year: e,
        safety,
        regulatory,
        investigatory,
        total: [safety, regulatory, investigatory].reduce((a, b) => a + b, 0),
      });
    });
    const newState = {
      isOpen: true,
      tableData,
      csvData: tableData,
    };
    setStopPurposeModalData(newState);
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
              iTickFormat={(t) => (t % 2 === 0 ? t : null)}
              iTickValues={reasonChartState.yearSet}
              dAxisProps={{
                tickFormat: (t) => `${t}`,
              }}
            />
          </S.LineWrapper>
          <S.LegendBeside>
            <DataSubsetPicker
              label="Stop Purpose"
              value={purpose}
              onChange={handleStopPurposeSelect}
              options={[PURPOSE_DEFAULT].concat(stopTypes)}
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
          tableData={stopPurposeModalData.tableData}
          csvData={stopPurposeModalData.csvData}
          columns={STOP_PURPOSE_TABLE_COLUMNS}
          tableDownloadName="Traffic Stops By Stop Purpose"
          isOpen={stopPurposeModalData.isOpen}
          closeModal={() => setStopPurposeModalData((state) => ({ ...state, isOpen: false }))}
        />
        <LineWrapper>
          <StopGroupsContainer>
            <LineChart
              data={stopPurposeGroupsData}
              title="Stop Purposes By Group"
              maintainAspectRatio={false}
            />
          </StopGroupsContainer>
        </LineWrapper>
      </S.ChartSection>
      <S.ChartSection>
        <ChartHeader chartTitle="Traffic Stops By Stop Purpose and Race Count" />
        <P>Shows the number of traffics stops broken down by purpose and race / ethnicity.</P>
        <Legend
          heading="Show on graph:"
          keys={stopPurposeEthnicGroups}
          onKeySelect={handleStopPurposeKeySelected}
          showNonHispanic
          row
        />
        <LineWrapper>
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
              title="Regulatory Equipment"
              maintainAspectRatio={false}
              displayLegend={false}
              yAxisMax={stopsGroupedByPurposeData.max_step_size}
              yAxisShowLabels={false}
            />
          </GroupedStopsContainer>
          <GroupedStopsContainer>
            <LineChart
              data={stopsGroupedByPurposeData.investigatory}
              title="Investigatory"
              maintainAspectRatio={false}
              displayLegend={false}
              yAxisMax={stopsGroupedByPurposeData.max_step_size}
              yAxisShowLabels={false}
            />
          </GroupedStopsContainer>
        </LineWrapper>
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
    Header: 'Investigatory',
    accessor: 'investigatory',
  },
  {
    Header: 'Total',
    accessor: 'total',
  },
];
