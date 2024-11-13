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

const graphTitle = 'Searches Leading to Arrest by Percentage ';

function PercentageOfSearches(props) {
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
    const url = `/api/agency/${agencyId}/arrests-percentage-of-searches/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
        const tableData = createTableData(res.data);
        const colors = [
          '#027979', //new color: Teal, old color:'#02bcbb',
          '#8352F4', //new color: Purple, old color:'#8879fc',
          '#E60032', //new color: Red, old color:'#9c0f2e',
          '#4153F6', //new color: Blue, old color: #0c3a66',
          '#E37C1C', //new color: Orange, old color: '#ffe066',
          '#B40895', //new color: Fuschia, old color: '#9e7b9b'
        ];
        const data = {
          labels: ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'],
          datasets: [
            {
              axis: 'y',
              label: 'All',
              data: res.data.arrest_percentages,
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
        setArrestData(data);
      })
      .catch((err) => console.log(err));
  }, [year]);

  const formatTooltipValue = (ctx) => `${(ctx.raw * 100).toFixed(2)}%`;

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
        <P>Percentage of searches that led to an arrest for a given race / ethnic group.</P>
        <NewModal
          tableHeader={graphTitle}
          tableSubheader="Shows what number of searches led to an arrest for a given race / ethnic group."
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
          displayLegend={false}
          tooltipLabelCallback={formatTooltipValue}
          modalConfig={{
            tableHeader: graphTitle,
            tableSubheader: getBarChartModalSubHeading(
              'Shows what number of searches led to an arrest for a given race / ethnic group'
            ),
            agencyName,
            chartTitle: getBarChartModalSubHeading(graphTitle),
          }}
        />
      </ChartContainer>
    </S.ChartSection>
  );
}

export default PercentageOfSearches;
