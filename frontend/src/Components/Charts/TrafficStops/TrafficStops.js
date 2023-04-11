import React, { useState, useEffect } from 'react';
import TrafficStopsStyled from './TrafficStops.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

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
import MonthRangePicker from '../../Elements/MonthRangePicker';

function TrafficStops(props) {
  const { agencyId } = props;

  const theme = useTheme();
  const officerId = useOfficerId();

  const [stopsChartState] = useDataset(agencyId, STOPS);
  const [reasonChartState] = useDataset(agencyId, STOPS_BY_REASON);
  const [pickerActive, setPickerActive] = useState(null);
  const [pickerXAxis, setPickerXAxis] = useState(null);

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

  const [byPercentageLineData, setByPercentageLineData] = useState([]);
  const [byPercentagePieData, setByPercentagePieData] = useState([]);

  const [byCountLineData, setByCountLineData] = useState([]);

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

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
            x: pickerXAxis === 'Month' ? d.date : d.year,
            y: d[race],
          }));
          return rGroup;
        });
      setByCountLineData(derivedData);
    }
  }, [stopsChartState.data[STOPS], purpose, countEthnicGroups, pickerActive]);

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
              x: pickerXAxis === 'Month' ? d.date : d.year,
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

  const handleViewPercentageData = () => {
    setPurpose(PURPOSE_DEFAULT);
    openModal(STOPS, STOPS_TABLE_COLUMNS);
  };

  const handleViewCountData = () => {
    openModal(STOPS_BY_REASON, BY_REASON_TABLE_COLUMNS);
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
    stopsChartState.yearSet = val.yearRange;
    reasonChartState.yearSet = val.yearRange;
    stopsChartState.data[STOPS] = val.data;

    setPickerXAxis(val.xAxis);
    setPickerActive((oldVal) => !oldVal);
  };

  const lineAxisFormat = (t) => {
    if (pickerActive !== null) {
      if (pickerXAxis === 'Month') {
        if (typeof t === 'string') {
          // Month label is YYYY-MM
          const month = new Date(t).getMonth() + 1;
          const datasetLength = stopsChartState.data[STOPS].length;
          if (datasetLength > 12 && datasetLength <= 24) {
            return month % 2 === 0 ? t : null;
          }
          if (datasetLength > 24) {
            return month % 3 === 0 ? t : null;
          }
        }

        return t;
      }
      if (reasonChartState.yearSet.length < 6) {
        return t;
      }
    }
    return t % 2 === 0 ? t : null;
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
              iTickValues={reasonChartState.yearSet}
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
            <div style={{ marginTop: '20px' }}>
              <MonthRangePicker
                agencyId={agencyId}
                dataSet={purpose !== PURPOSE_DEFAULT ? STOPS_BY_REASON : STOPS}
                onChange={updateStopsByCount}
                onClosePicker={() => setPickerActive(null)}
              />
            </div>
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
