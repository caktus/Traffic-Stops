import React, { useState, useEffect } from 'react';
import UseOfForceStyled from './UseOfForce.styled';
import * as S from '../ChartSections/ChartsCommon.styled';

// Util
import {
  YEARS_DEFAULT,
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
import useOfficerId from '../../../Hooks/useOfficerId';
import PieChart from '../../NewCharts/PieChart';
import { pieChartConfig, pieChartLabels } from '../../../util/setChartColors';
import VerticalBarChart from '../../NewCharts/VerticalBarChart';
import axios from '../../../Services/Axios';

function UseOfForce(props) {
  const { agencyId, showCompare, year } = props;
  const officerId = useOfficerId();

  const [chartState] = useDataset(agencyId, USE_OF_FORCE);

  const [useOfForceBarData, setUseOfForceBarData] = useState({
    labels: [],
    datasets: [],
    loading: true,
  });
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
      return 'by this officer';
    }
    if (agencyId === '-1') {
      return 'for the entire state';
    }
    return 'by this department';
  };

  useEffect(() => {
    let url = `/api/agency/${agencyId}/use-of-force/`;
    if (officerId) {
      url = `${url}?officer=${officerId}`;
    }
    axios
      .get(url)
      .then((res) => {
        setUseOfForceBarData(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

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

  // Handle stops by percentage legend interactions
  const handleViewData = () => {
    openModal(USE_OF_FORCE, TABLE_COLUMNS);
  };

  const chartModalTitle = (displayYear = true) => {
    let subject = chartState.data[AGENCY_DETAILS].name;
    if (officerId) {
      subject = `Officer ${officerId}`;
    }
    let yearOf = `since ${useOfForceBarData.labels[0]}`;
    if (displayYear) {
      yearOf = year === YEARS_DEFAULT ? `since ${useOfForceBarData.labels[0]}` : `in ${year}`;
    }
    return `Use of Force for ${subject} ${yearOf}`;
  };

  const getChartModalSubHeading = (displayYear = true) => {
    let yearOf = '';
    if (displayYear) {
      yearOf = year && year !== 'All' ? ` in ${year}` : '';
    }
    return `Shows the race/ethnic composition of drivers ${subjectObserving()}${yearOf} reported using force against.`;
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
          <VerticalBarChart
            title="Use Of Force"
            data={useOfForceBarData}
            modalConfig={{
              tableHeader: 'Use of Force',
              tableSubheader: getChartModalSubHeading(false),
              agencyName: chartState.data[AGENCY_DETAILS].name,
              chartTitle: chartModalTitle(false),
            }}
          />
        </S.ChartSubsection>
        <S.ChartSubsection>
          <S.PieWrapper>
            <PieChart
              data={useOfForcePieData}
              displayLegend={false}
              maintainAspectRatio
              modalConfig={{
                tableHeader: 'Use of Force',
                tableSubheader: getChartModalSubHeading(),
                agencyName: chartState.data[AGENCY_DETAILS].name,
                chartTitle: chartModalTitle(),
              }}
            />
          </S.PieWrapper>
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
