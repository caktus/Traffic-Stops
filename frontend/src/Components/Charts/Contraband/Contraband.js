import React, { useEffect, useState } from 'react';
import ContrabandStyled from './Contraband.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Util
import toTitleCase from '../../../util/toTitleCase';
import {
  reduceYearsToTotal,
  calculatePercentage,
  getQuantityForYear,
  CONTRABAND_TYPES,
  CONTRABAND_DEFAULT,
  RACES,
  YEARS_DEFAULT,
} from '../chartUtils';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// State
import useDataset, { CONTRABAND_HIT_RATE } from '../../../Hooks/useDataset';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import Bar from '../ChartPrimitives/Bar';
import ChartHeader from '../ChartSections/ChartHeader';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';

function SearchRate(props) {
  const { agencyId, showCompare } = props;
  const theme = useTheme();

  const [chartState] = useDataset(agencyId, CONTRABAND_HIT_RATE);

  const [year, setYear] = useState(YEARS_DEFAULT);
  const [contrabandType, setContrabandType] = useState(CONTRABAND_DEFAULT);

  const [contrabandData, setContrabandData] = useState();

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

  /* CALCULATE AND BUILD CHART DATA */
  // Build data for Contraband Hit Rate
  useEffect(() => {
    const data = chartState.data[CONTRABAND_HIT_RATE];
    if (data) {
      const { contraband, searches, contraband_types: contrabandTypes } = data;
      if (year && year !== YEARS_DEFAULT) {
        // If an agency has no data for selected year
        if (contraband.filter((c) => c.year === year).length === 0) {
          setContrabandData(
            RACES.map((ethnicGroup) => ({
              displayName: toTitleCase(ethnicGroup),
              color: `${theme.colors.ethnicGroup[ethnicGroup]}90`,
              x: toTitleCase(ethnicGroup),
              y: 0,
            }))
          );
          return;
        }
      }
      const mappedData = [];
      const contrabandDataList =
        contrabandType !== CONTRABAND_DEFAULT
          ? contrabandTypes.filter((c) => c.contraband_type === contrabandType)
          : contraband;
      RACES.forEach((ethnicGroup) => {
        const groupBar = {};
        const displayName = toTitleCase(ethnicGroup);
        groupBar.displayName = displayName;
        groupBar.color = `${theme.colors.ethnicGroup[ethnicGroup]}90`;
        groupBar.x = displayName;
        if (year === YEARS_DEFAULT) {
          const groupContraband = reduceYearsToTotal(contrabandDataList, ethnicGroup)[ethnicGroup];
          const groupSearches = reduceYearsToTotal(searches, ethnicGroup)[ethnicGroup];
          groupBar.y = calculatePercentage(groupContraband, groupSearches);
        } else {
          const yearInt = parseInt(year, 10);
          const groupContrabandForYear = getQuantityForYear(contraband, yearInt, ethnicGroup);
          const groupSearchesForYear = getQuantityForYear(searches, yearInt, ethnicGroup);
          groupBar.y = calculatePercentage(groupContrabandForYear, groupSearchesForYear);
        }
        mappedData.push(groupBar);
      });
      if (mappedData) {
        setContrabandData(mappedData.reverse());
      } else {
        setContrabandData([]);
      }
    }
  }, [chartState.data[CONTRABAND_HIT_RATE], year, contrabandType]);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  const handleViewData = () => {
    openModal(CONTRABAND_HIT_RATE, TABLE_COLUMNS);
  };

  const handleContrabandTypeSelect = (c) => {
    if (c === contrabandType) return;
    setContrabandType(c);
  };

  return (
    <ContrabandStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader chartTitle='Contraband "Hit Rate"' handleViewData={handleViewData} />
        <S.ChartDescription>
          <P>
            Shows what percentage of searches discovered contraband for a given race / ethnic group
          </P>
        </S.ChartDescription>
        <S.ChartSubsection showCompare={showCompare}>
          <S.LineSection>
            <S.LineWrapper>
              <Bar
                data={contrabandData}
                chartProps={{
                  domainPadding: { x: 20 },
                }}
                yAxisProps={{
                  tickValues: [0, 20, 40, 60, 80, 100],
                  tickFormat: (t) => `${t}%`,
                }}
                xAxisProps={{
                  tickFormat: (t) => {
                    if (t === 'Native American') {
                      return 'Native \n American';
                    }
                    return t;
                  },
                }}
                barProps={{
                  horizontal: true,
                  style: {
                    data: { fill: ({ datum }) => datum.color },
                    labels: { fontSize: 8 },
                  },
                  labels: ({ datum }) => `${datum.y}%`,
                  barWidth: 20,
                }}
              />
            </S.LineWrapper>
          </S.LineSection>
          <S.LegendSection>
            <DataSubsetPicker
              label="Year"
              value={year}
              onChange={handleYearSelect}
              options={[YEARS_DEFAULT].concat(chartState.yearRange)}
              dropUp={!!showCompare}
            />
            <DataSubsetPicker
              label="Contraband Type"
              value={contrabandType}
              onChange={handleContrabandTypeSelect}
              options={[CONTRABAND_DEFAULT].concat(CONTRABAND_TYPES)}
            />
          </S.LegendSection>
        </S.ChartSubsection>
      </S.ChartSection>
    </ContrabandStyled>
  );
}

export default SearchRate;

const TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year', // accessor is the "key" in the data
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
