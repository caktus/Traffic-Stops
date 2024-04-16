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
import DataSubsetPicker from '../../ChartSections/DataSubsetPicker/DataSubsetPicker';
import createTableData from '../../../../util/createTableData';
import { RACE_TABLE_COLUMNS, STOP_PURPOSE_GROUPS } from '../../chartUtils';

const graphTitle = 'Percentage of Stops Leading to Arrest by Stop Purpose Group';

function PercentageOfStopsForStopPurposeGroup(props) {
  const { agencyId, agencyName, year } = props;

  const officerId = useOfficerId();

  const initArrestData = {
    labels: [],
    datasets: [],
    loading: true,
  };
  const [arrestData, setArrestData] = useState(initArrestData);
  const [arrestTableData, setArrestTableData] = useState({
    isOpen: false,
    tableData: [],
    csvData: [],
  });
  const [selectedStopPurpose, setSelectedStopPurpose] = useState(STOP_PURPOSE_GROUPS[0]);

  useEffect(() => {
    const params = [];
    if (year && year !== 'All') {
      params.push({ param: 'year', val: year });
    }
    if (officerId) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/arrests-percentage-of-stops-by-purpose-group/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
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
        };
        setArrestData(data);
      })
      .catch((err) => console.log(err));
  }, [year]);

  useEffect(() => {
    const params = [];
    params.push({
      param: 'grouped_stop_purpose',
      val: selectedStopPurpose,
    });
    if (officerId) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${encodeURI(p.val)}`).join('&');
    const url = `/api/agency/${agencyId}/arrests-percentage-of-stops-by-purpose-group/?modal=true&${urlParams}`;
    axios.get(url).then((res) => {
      const tableData = createTableData(res.data);
      setArrestTableData((state) => ({ ...state, tableData, csvData: tableData }));
    });
  }, [selectedStopPurpose]);

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
        handleViewData={() => setArrestTableData((state) => ({ ...state, isOpen: true }))}
      />
      {props.children}
      <S.ChartDescription>
        <P>Percentage of stops that led to an arrest for a given stop purpose group.</P>
        <NewModal
          tableHeader={graphTitle}
          tableSubheader="Shows what percentage of stops led to an arrest for a given stop purpose group."
          agencyName={agencyName}
          tableData={arrestTableData.tableData}
          csvData={arrestTableData.csvData}
          columns={RACE_TABLE_COLUMNS}
          tableDownloadName={graphTitle}
          isOpen={arrestTableData.isOpen}
          closeModal={() => setArrestTableData((state) => ({ ...state, isOpen: false }))}
        >
          <DataSubsetPicker
            label="Stop Purpose"
            value={selectedStopPurpose}
            onChange={(stopPurpose) => setSelectedStopPurpose(stopPurpose)}
            options={STOP_PURPOSE_GROUPS}
          />
        </NewModal>
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
              'Shows what percentage of stops led to an arrest for a given stop purpose group.'
            ),
            agencyName,
            chartTitle: getBarChartModalSubHeading(graphTitle),
          }}
        />
      </ChartContainer>
    </S.ChartSection>
  );
}

export default PercentageOfStopsForStopPurposeGroup;
