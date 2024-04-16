import React, { useEffect, useState } from 'react';
import * as S from '../../ChartSections/ChartsCommon.styled';

// Children
import { P } from '../../../../styles/StyledComponents/Typography';
import ChartHeader from '../../ChartSections/ChartHeader';
import HorizontalBarChart from '../../../NewCharts/HorizontalBarChart';
import axios from '../../../../Services/Axios';
import useOfficerId from '../../../../Hooks/useOfficerId';
import { ChartWrapper } from '../Arrests.styles';
import NewModal from '../../../NewCharts/NewModal';
import createTableData from '../../../../util/createTableData';
import { RACE_TABLE_COLUMNS } from '../../chartUtils';

function CountOfStopsAndArrests(props) {
  const { agencyId, agencyName, showCompare, year } = props;

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
        const colors = ['#96a0fa', '#5364f4'];

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
        chartTitle="Stop Counts With/Without Arrests"
        handleViewData={() => setArrestData((state) => ({ ...state, isOpen: true }))}
      />
      <S.ChartDescription>
        <P>Percentage of stops that led to an arrest for a given race / ethnic group.</P>
        <NewModal
          tableHeader="Stop Counts With/Without Arrests"
          tableSubheader="Shows what numbers of stops led to an arrest for a given race / ethnic group."
          agencyName={agencyName}
          tableData={arrestData.tableData}
          csvData={arrestData.csvData}
          columns={RACE_TABLE_COLUMNS}
          tableDownloadName="Arrests_By_Percentage"
          isOpen={arrestData.isOpen}
          closeModal={() => setArrestData((state) => ({ ...state, isOpen: false }))}
        />
      </S.ChartDescription>
      <S.ChartSubsection showCompare={showCompare}>
        <ChartWrapper>
          <HorizontalBarChart
            title="Stop Counts With/Without Arrests"
            data={arrestData}
            pinMaxValue={false}
            xStacked
            yStacked
            tickStyle={null}
            stepSize={50000}
            tooltipLabelCallback={formatTooltipValue}
            modalConfig={{
              tableHeader: 'Stop Counts With/Without Arrests',
              tableSubheader: getBarChartModalSubHeading(
                'Shows what number of stops led to an arrest for a given race / ethnic group'
              ),
              agencyName,
              chartTitle: getBarChartModalSubHeading('Stop Counts With/Without Arrests'),
            }}
          />
        </ChartWrapper>
      </S.ChartSubsection>
    </S.ChartSection>
  );
}

export default CountOfStopsAndArrests;
