import React, { useState, useEffect } from 'react';
import UseOfForceStyled from './UseOfForce.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Util
import {
  YEARS_DEFAULT,
  STATIC_LEGEND_KEYS,
  RACES,
  calculatePercentage,
  calculateYearTotal,
  reduceYearsToTotal,
} from '../chartUtils';

// State
import useDataset, { AGENCY_DETAILS, USE_OF_FORCE } from '../../../Hooks/useDataset';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import Legend from '../ChartSections/Legend/Legend';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import useOfficerId from '../../../Hooks/useOfficerId';
import GroupedBar from '../ChartPrimitives/GroupedBar';
import PieChart from '../../NewCharts/PieChart';
import getDownloadableTitle from '../../../util/getDownloadableTitle';
import { pieChartConfig, pieChartLabels } from '../../../util/setChartColors';

function UseOfForce(props) {
  const { agencyId, showCompare } = props;
  const officerId = useOfficerId();
  const theme = useTheme();

  const [chartState] = useDataset(agencyId, USE_OF_FORCE);

  const [year, setYear] = useState(YEARS_DEFAULT);
  const [pickerActive] = useState(null);
  const [pickerXAxis] = useState(null);

  const [ethnicGroupKeys, setEthnicGroupKeys] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [useOfForceData, setUseOfForceData] = useState([]);
  const [useOfForcePieData, setUseOfForcePieData] = useState({
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

  const subjectObserving = () => {
    if (officerId) {
      return 'whom this officer';
    }
    if (agencyId) {
      return 'whom law enforcement officers';
    }
    return '';
  };

  /* BUILD DATA */
  // Bar chart data
  useEffect(() => {
    const data = chartState.data[USE_OF_FORCE];
    if (data) {
      const mappedData = ethnicGroupKeys
        .filter((e) => e.selected)
        .map((eg) => {
          const ethnicGroup = eg.value;
          return {
            id: ethnicGroup,
            color: theme.colors.ethnicGroup[ethnicGroup],
            data: data.map((d) => ({
              x: pickerXAxis === 'Month' ? d.date : d.year,
              y: d[ethnicGroup],
              ethnicGroup: eg.label,
              color: theme.colors.ethnicGroup[ethnicGroup],
            })),
          };
        });
      setUseOfForceData(mappedData);
    }
  }, [chartState.data[USE_OF_FORCE], ethnicGroupKeys]);

  // Pie chart data
  useEffect(() => {
    if (chartState.data[USE_OF_FORCE]) {
      const data = chartState.data[USE_OF_FORCE];
      let chartData = [0, 0, 0, 0, 0];

      if (!year || year === 'All') {
        const totals = {};
        RACES.forEach((race) => {
          totals[race] = reduceYearsToTotal(data, race)[race];
        });
        const total = calculateYearTotal(totals, RACES);
        chartData = RACES.map((race) => calculatePercentage(totals[race], total));
      } else {
        const yearData = data.find((d) => d.year === year);
        if (yearData) {
          const total = RACES.map((race) => yearData[race]).reduce((a, b) => a + b, 0);
          chartData = RACES.map((race) => calculatePercentage(yearData[race], total));
        }
      }

      setUseOfForcePieData({
        labels: pieChartLabels,
        datasets: [
          {
            data: chartData,
            ...pieChartConfig,
          },
        ],
      });
    }
  }, [chartState.data[USE_OF_FORCE], year]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelected = (y) => {
    if (y === year) return;
    setYear(y);
  };
  // Handle stops by percentage legend interactions
  const handleGroupKeySelected = (ethnicGroup) => {
    const groupIndex = ethnicGroupKeys.indexOf(
      ethnicGroupKeys.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...ethnicGroupKeys];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setEthnicGroupKeys(updatedGroups);
  };
  const handleViewData = () => {
    openModal(USE_OF_FORCE, TABLE_COLUMNS);
  };

  const lineAxisFormat = (t) => {
    if (pickerActive) {
      return t;
    }
    return t % 2 === 0 ? t : null;
  };

  const pieChartTitle = (download = false) => {
    let subject = chartState.data[AGENCY_DETAILS].name;
    if (subjectObserving() === 'officer') {
      subject = `Officer ${officerId}`;
    }
    let title = `Use of Force for ${subject} ${
      year === YEARS_DEFAULT ? `since ${chartState.yearRange.reverse()[0]}` : `during ${year}`
    }`;
    if (download) {
      title = getDownloadableTitle(title);
    }
    return title;
  };

  return (
    <UseOfForceStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader chartTitle="Use of Force" handleViewData={handleViewData} />
        <S.ChartDescription>
          <P>
            Shows the race/ethnic composition of drivers {subjectObserving()} reported using force
            against.
          </P>
        </S.ChartDescription>
        <S.ChartSubsection showCompare={showCompare}>
          <S.LineSection>
            <S.LineWrapper>
              <GroupedBar
                data={useOfForceData}
                iTickFormat={lineAxisFormat}
                iTickValues={chartState.yearSet}
                loading={chartState.loading[USE_OF_FORCE]}
                toolTipFontSize={16}
                dAxisProps={{
                  tickFormat: (t) => `${t}`,
                }}
              />
            </S.LineWrapper>
            <Legend
              heading="Show on graph:"
              keys={ethnicGroupKeys}
              onKeySelect={handleGroupKeySelected}
              showNonHispanic
            />
          </S.LineSection>
          <S.PieSection>
            <S.PieWrapper>
              <PieChart
                data={useOfForcePieData}
                displayLegend={false}
                maintainAspectRatio
                modalConfig={{
                  tableHeader: 'Use of Force',
                  tableSubheader: `Shows the race/ethnic composition of drivers ${subjectObserving()} reported using force
            against.`,
                  agencyName: chartState.data[AGENCY_DETAILS].name,
                  chartTitle: pieChartTitle(),
                  fileName: pieChartTitle(true),
                }}
              />
            </S.PieWrapper>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelected}
              options={[YEARS_DEFAULT].concat(chartState.yearRange)}
              dropUp
            />
          </S.PieSection>
        </S.ChartSubsection>
      </S.ChartSection>
    </UseOfForceStyled>
  );
}

export default UseOfForce;

const TABLE_COLUMNS = [
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
