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
import { ARRESTS_TABLE_COLUMNS } from '../Arrests';

const graphTitle = 'Percentage of Searches Leading to Arrest by Stop Purpose Group ';

function PercentageOfSearchesForStopPurposeGroup(props) {
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
    const url = `/api/agency/${agencyId}/arrests-percentage-of-searches-by-purpose-group/?${urlParams}`;
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
            white: e.white,
            black: e.black,
            native_american: e.native_american,
            asian: e.asian,
            other: e.other,
            hispanic: e.hispanic,
            total: Object.values(dataCounts).reduce((a, b) => a + b, 0),
          });
        });

        const colors = {
          'Safety Violation': '#5F0F40',
          'Regulatory Equipment': '#E36414',
          Other: '#0F4C5C',
        };
        const data = {
          labels: Object.keys(colors),
          datasets: [
            {
              axis: 'y',
              label: 'All',
              data: res.data.arrest_percentages.map((d) => d.data),
              fill: false,
              backgroundColor: Object.values(colors),
              borderColor: Object.values(colors),
              hoverBackgroundColor: Object.values(colors),
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
      {props.children}
      <S.ChartDescription>
        <P>Percentage of searches that led to an arrest for a given stop purpose group.</P>
        <NewModal
          tableHeader={graphTitle}
          tableSubheader="Shows what percentage of searches led to an arrest for a given stop purpose group."
          agencyName={agencyName}
          tableData={arrestData.tableData}
          csvData={arrestData.csvData}
          columns={ARRESTS_TABLE_COLUMNS}
          tableDownloadName={graphTitle}
          isOpen={arrestData.isOpen}
          closeModal={() => setArrestData((state) => ({ ...state, isOpen: false }))}
        />
      </S.ChartDescription>
      <S.ChartSubsection showCompare={showCompare}>
        <ChartWrapper>
          <HorizontalBarChart
            title={graphTitle}
            data={arrestData}
            displayLegend={false}
            tooltipLabelCallback={formatTooltipValue}
            modalConfig={{
              tableHeader: graphTitle,
              tableSubheader: getBarChartModalSubHeading(
                'Shows what percentage of searches led to an arrest for a given stop purpose group.'
              ),
              agencyName,
              chartTitle: getBarChartModalSubHeading(graphTitle),
            }}
          />
        </ChartWrapper>
      </S.ChartSubsection>
    </S.ChartSection>
  );
}

export default PercentageOfSearchesForStopPurposeGroup;
