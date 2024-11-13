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
import { CONTRABAND_TYPES_TABLE_COLUMNS } from '../../chartUtils';

const graphTitle = 'Percentage of Stops Leading to Arrest by Discovered Contraband Type';

function PercentageOfStopsPerContrabandType(props) {
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
    const url = `/api/agency/${agencyId}/arrests-percentage-of-stops-per-contraband-type/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
        const tableData = [];
        const resTableData = res.data.table_data.length
          ? JSON.parse(res.data.table_data)
          : { data: [] };
        resTableData.data.forEach((e) => {
          const dataCounts = { ...e };
          delete dataCounts.year;
          // Need to assign explicitly otherwise the download data orders columns by alphabet.
          tableData.unshift({
            year: e.year,
            alcohol: e.alcohol,
            drugs: e.drugs,
            money: e.money,
            other: e.other,
            weapons: e.weapons,
            total: Object.values(dataCounts).reduce((a, b) => a + b, 0),
          });
        });
        const colors = ['#E37C1C', '#4153F6', '#027979', '#B40895', '#E60032'];
        const data = {
          labels: ['Alcohol', 'Drugs', 'Money', 'Other', 'Weapons'],
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
          tableData,
          csvData: tableData,
          isModalOpen: false,
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
        <P>Percentage of stops that led to an arrest for a given contraband type.</P>
        <NewModal
          tableHeader={graphTitle}
          tableSubheader="Shows what percentage of stops led to an arrest for a given contraband type."
          agencyName={agencyName}
          tableData={arrestData.tableData}
          csvData={arrestData.csvData}
          columns={CONTRABAND_TYPES_TABLE_COLUMNS}
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
              'Shows what percentage of stops led to an arrest for a given contraband type'
            ),
            agencyName,
            chartTitle: getBarChartModalSubHeading(graphTitle),
          }}
        />
      </ChartContainer>
    </S.ChartSection>
  );
}

export default PercentageOfStopsPerContrabandType;
