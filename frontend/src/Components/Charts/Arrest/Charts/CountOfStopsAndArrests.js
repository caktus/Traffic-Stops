import React, { useEffect, useState } from 'react';
import * as S from '../../ChartSections/ChartsCommon.styled';

// Children
import { P } from '../../../../styles/StyledComponents/Typography';
import ChartHeader from '../../ChartSections/ChartHeader';
import HorizontalBarChart from '../../../NewCharts/HorizontalBarChart';
import axios from '../../../../Services/Axios';
import useOfficerId from '../../../../Hooks/useOfficerId';
import NewModal from '../../../NewCharts/NewModal';
import { ChartContainer } from '../../ChartSections/ChartsCommon.styled';
import createTableData from '../../../../util/createTableData';
import { RACE_TABLE_COLUMNS } from '../../chartUtils';

const graphTitle = 'Traffic Stops Leading to Arrest by Count';

function CountOfStopsAndArrests(props) {
  const { agencyId, agencyName, year } = props;

  const officerId = useOfficerId();

  const initArrestData = {
    labels: [],
    datasets: [],
    isModalOpen: false,
    tableData: [],
    csvData: [],
    loading: true,
  };
  const [arrestData, setArrestData] = useState(initArrestData);

  useEffect(() => {
    const params = [];
    if (year && year !== 'All') {
      params.push({ param: 'year', val: year });
    }
    if (officerId) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/arrests-stops-driver-arrested/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
        const tableData = createTableData(res.data);
        const labels = ['Stops With Arrests', 'Stops Without Arrests'];
        const colors = [
          '#4153F6', //'#96a0fa',
          '#E37C1C', //'#5364f4'
        ];

        const datasets = res.data.arrest_counts.map((dataset, i) => ({
          axis: 'y',
          label: labels[i],
          data: dataset.data,
          fill: false,
          backgroundColor: colors[i],
          borderColor: colors[i],
          hoverBackgroundColor: colors[i],
          borderWidth: 1,
        }));
        const data = {
          labels: ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets,
          isModalOpen: false,
          tableData,
          csvData: tableData,
        };

        setArrestData(data);
      })
      .catch((err) => console.log(err));
  }, [year]);

  const formatTooltipValue = (ctx) => ctx.raw;

  const subjectObserving = () => {
    if (officerId) {
      return 'by this officer';
    }
    if (agencyId === '-1') {
      return 'for the entire state';
    }
    return 'by this department';
  };

  const getYearPhrase = () => (year && year !== 'All' ? ` in ${year}` : '');

  const getBarChartModalSubHeading = (title) => `${title} ${subjectObserving()}${getYearPhrase()}`;

  return (
    <S.ChartSection>
      <ChartHeader
        chartTitle={graphTitle}
        handleViewData={() => setArrestData((state) => ({ ...state, isOpen: true }))}
      />
      <S.ChartDescription>
        <P>Count of stops and corresponding arrests for a given race/ethnic group.</P>
        <NewModal
          tableHeader={graphTitle}
          tableSubheader="Shows count of stops and corresponding arrests for a given race/ethnic group."
          agencyName={agencyName}
          tableData={arrestData.tableData}
          csvData={arrestData.csvData}
          columns={RACE_TABLE_COLUMNS}
          tableDownloadName={graphTitle}
          isOpen={arrestData.isOpen}
          closeModal={() => setArrestData((state) => ({ ...state, isOpen: false }))}
        />
      </S.ChartDescription>
      <ChartContainer>
        <HorizontalBarChart
          title={graphTitle}
          data={arrestData}
          pinMaxValue={false}
          xStacked
          yStacked
          tickStyle={null}
          stepSize={50000}
          tooltipLabelCallback={formatTooltipValue}
          modalConfig={{
            tableHeader: graphTitle,
            tableSubheader: getBarChartModalSubHeading(
              'Shows count of stops and corresponding arrests for a given race/ethnic group'
            ),
            agencyName,
            chartTitle: getBarChartModalSubHeading(graphTitle),
          }}
        />
      </ChartContainer>
    </S.ChartSection>
  );
}

export default CountOfStopsAndArrests;
