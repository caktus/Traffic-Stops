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
import DataSubsetPicker from '../../ChartSections/DataSubsetPicker/DataSubsetPicker';
import { RACE_TABLE_COLUMNS, STOP_PURPOSE_TYPES } from '../../chartUtils';

function PercentageOfStopsForStopPurpose(props) {
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

  const [arrestTableData, setArrestTableData] = useState({
    isOpen: false,
    tableData: [],
    csvData: [],
  });
  const [selectedStopPurpose, setSelectedStopPurpose] = useState(STOP_PURPOSE_TYPES[0]);

  useEffect(() => {
    const params = [];
    if (year && year !== 'All') {
      params.push({ param: 'year', val: year });
    }
    if (officerId) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${p.val}`).join('&');
    const url = `/api/agency/${agencyId}/arrests-percentage-of-stops-per-stop-purpose/?${urlParams}`;
    axios
      .get(url)
      .then((res) => {
        const data = {
          labels: res.data.labels,
          datasets: [
            {
              axis: 'y',
              label: 'All',
              data: res.data.arrest_percentages.map((d) => d.data),
              fill: false,
              // backgroundColor: Object.values(colors),
              // borderColor: Object.values(colors),
              // hoverBackgroundColor: Object.values(colors),
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
      param: 'stop_purpose_type',
      val: selectedStopPurpose,
    });
    if (officerId) {
      params.push({ param: 'officer', val: officerId });
    }

    const urlParams = params.map((p) => `${p.param}=${encodeURI(p.val)}`).join('&');
    const url = `/api/agency/${agencyId}/arrests-percentage-of-stops-per-stop-purpose/?modal=true&${urlParams}`;
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
        chartTitle="Percentage of Stops With Arrests Per Stop Purpose"
        handleViewData={() => setArrestTableData((state) => ({ ...state, isOpen: true }))}
      />
      <S.ChartDescription>
        <P>Percentage of stops that led to an arrest for a given stop purpose group.</P>
        <NewModal
          tableHeader="Percentage of Stops With Arrests Per Stop Purpose"
          tableSubheader="Shows what percentage of stops led to an arrest for a given stop purpose."
          agencyName={agencyName}
          tableData={arrestTableData.tableData}
          csvData={arrestTableData.csvData}
          columns={RACE_TABLE_COLUMNS}
          tableDownloadName="Arrests_By_Percentage"
          isOpen={arrestTableData.isOpen}
          closeModal={() => setArrestTableData((state) => ({ ...state, isOpen: false }))}
        >
          <DataSubsetPicker
            label="Stop Purpose"
            value={selectedStopPurpose}
            onChange={(stopPurpose) => setSelectedStopPurpose(stopPurpose)}
            options={STOP_PURPOSE_TYPES}
          />
        </NewModal>
      </S.ChartDescription>
      <S.ChartSubsection showCompare={showCompare}>
        <ChartWrapper>
          <HorizontalBarChart
            title="Percentage of Stops With Arrests Per Stop Purpose"
            data={arrestData}
            displayLegend={false}
            tooltipLabelCallback={formatTooltipValue}
            modalConfig={{
              tableHeader: 'Percentage of Stops With Arrests Per Stop Purpose',
              tableSubheader: getBarChartModalSubHeading(
                'Shows what percentage of stops led to an arrest for a given stop purpose.'
              ),
              agencyName,
              chartTitle: getBarChartModalSubHeading(
                'Percentage of Stops With Arrests Per Stop Purpose'
              ),
            }}
          />
        </ChartWrapper>
      </S.ChartSubsection>
    </S.ChartSection>
  );
}

export default PercentageOfStopsForStopPurpose;
