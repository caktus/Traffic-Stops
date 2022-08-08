import React, { useState, useEffect } from 'react';
import SearchRateStyled from './SearchRate.styled';
import * as S from '../ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Router
import { useHistory } from 'react-router-dom';

// Data
import useDataset, { LIKELIHOOD_OF_SEARCH } from '../../../Hooks/useDataset';

// Hooks
import useOfficerId from '../../../Hooks/useOfficerId';
import useMetaTags from '../../../Hooks/useMetaTags';
import useTableModal from '../../../Hooks/useTableModal';

// Constants
import {
  STATIC_LEGEND_KEYS,
  YEARS_DEFAULT,
  getGroupValueBasedOnYear,
  getRatesAgainstBase,
  STOP_TYPES,
  calculateAveragePercentage,
} from '../chartUtils';
import { AGENCY_LIST_SLUG, SEARCHES_SLUG } from '../../../Routes/slugs';

// Children
import { P } from '../../../styles/StyledComponents/Typography';
import ChartHeader from '../ChartSections/ChartHeader';
import Legend from '../ChartSections/Legend/Legend';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';
import GroupedBar from '../ChartPrimitives/GroupedBar';
import { VictoryLabel } from 'victory';

function SearchRate(props) {
  const { agencyId } = props;
  const theme = useTheme();
  const history = useHistory();
  const officerId = useOfficerId();

  const [chartState] = useDataset(agencyId, LIKELIHOOD_OF_SEARCH);

  const [year, setYear] = useState(YEARS_DEFAULT);
  const [ethnicGroupKeys, setEthnicGroupKeys] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [chartData, setChartData] = useState([]);
  const [noBaseSearches, setNoBaseSearches] = useState(false);

  const renderMetaTags = useMetaTags();
  const [renderTableModal, { openModal }] = useTableModal();

  /* BUILD DATA */
  useEffect(() => {
    const data = chartState.data[LIKELIHOOD_OF_SEARCH];
    if (data) {
      const baseGroupTotalSearches = getGroupValueBasedOnYear(
        data.searches,
        'white',
        year,
        STOP_TYPES
      );
      if (_entityHasNoBaseSearches(baseGroupTotalSearches)) {
        setNoBaseSearches(true);
        return;
      }
      setNoBaseSearches(false);

      const baseGroupTotalStops = getGroupValueBasedOnYear(data.stops, 'white', year, STOP_TYPES);
      let mappedData = ethnicGroupKeys
        .filter((g) => g.selected && g.value !== 'white')
        .map((g) => {
          const ethnicGroup = g.value;
          const groupTotalSearches = getGroupValueBasedOnYear(
            data.searches,
            ethnicGroup,
            year,
            STOP_TYPES
          );
          const groupTotalStops = getGroupValueBasedOnYear(
            data.stops,
            ethnicGroup,
            year,
            STOP_TYPES
          );
          const ratesByReason = getRatesAgainstBase(
            baseGroupTotalSearches,
            baseGroupTotalStops,
            groupTotalSearches,
            groupTotalStops
          );
          return {
            id: ethnicGroup,
            color: `${theme.colors.ethnicGroup[ethnicGroup]}90`,
            data: STOP_TYPES.map((reason) => ({
              x: reason,
              y: ratesByReason[reason],
              ethnicGroup: g.label,
              color: theme.colors.ethnicGroup[ethnicGroup],
            })),
          };
        });
      mappedData = calculateAveragePercentage(mappedData);
      setChartData(mappedData);
    }
  }, [chartState.data[LIKELIHOOD_OF_SEARCH], ethnicGroupKeys, year]);

  const _entityHasNoBaseSearches = (baseGroupSearches) =>
    Object.values(baseGroupSearches).every((v) => v === 0);

  /* INTERACTIONS */
  // Handle year dropdown state
  const handleYearSelected = (y) => {
    if (y === year) return;
    setYear(y);
  };

  // Legend interaction
  const handleGroupKeySelected = (ethnicGroup) => {
    const groupIndex = ethnicGroupKeys.indexOf(
      ethnicGroupKeys.find((g) => g.value === ethnicGroup.value)
    );
    const updatedGroups = [...ethnicGroupKeys];
    updatedGroups[groupIndex].selected = !updatedGroups[groupIndex].selected;
    setEthnicGroupKeys(updatedGroups);
  };

  const handleViewData = () => {
    openModal(LIKELIHOOD_OF_SEARCH, TABLE_COLUMNS);
  };

  const getSearchesUrlForOfficer = () =>
    `${AGENCY_LIST_SLUG}/${agencyId}${SEARCHES_SLUG}/?officer=${officerId}`;

  return (
    <SearchRateStyled>
      {renderMetaTags()}
      {renderTableModal()}
      <S.ChartSection>
        <ChartHeader chartTitle="Likelihood of Search" handleViewData={handleViewData} />
        <S.ChartDescription>
          <P>
            Shows the likelihood that drivers of a particular race / ethnicity are searched compared
            to white drivers, based on stop cause. Stops done for “safety” purposes may be less
            likely to show racial bias than stops done for “investigatory” purposes.
          </P>
          <P>
            <strong>NOTE:</strong> Large or unexpected percentages may be based on a low number of
            incidents. Use “View Data” to see the numbers underlying the calculations.
          </P>
        </S.ChartDescription>
        <S.ChartSubsection showCompare={props.showCompare}>
          <S.LineWrapper>
            {noBaseSearches ? (
              <S.NoBaseSearches>
                <P>
                  This {officerId ? 'officer' : 'department'}{' '}
                  <strong>has not reported searching any people identified as white</strong>. No
                  comparisons can be made.
                </P>
                <P>
                  For a better comparison, view{' '}
                  <S.NoBaseLink onClick={() => history.push(getSearchesUrlForOfficer())}>
                    search counts and percentages
                  </S.NoBaseLink>
                  .
                </P>
              </S.NoBaseSearches>
            ) : (
              <GroupedBar
                data={chartData}
                loading={chartState.loading[LIKELIHOOD_OF_SEARCH]}
                horizontal
                iAxisProps={{
                  tickLabelComponent: <VictoryLabel x={100} dx={-50} style={{ fontSize: 6 }} />,
                  tickFormat: (t) => (t.split ? t.split(' ') : t),
                }}
                dAxisProps={{
                  tickFormat: (t) => `${t}%`,
                }}
                chartProps={{
                  height: 500,
                  width: 400,
                }}
                barProps={{ barWidth: 10, yAxisLabel: (val) => `${val}%` }}
                toolTipFontSize={7}
              />
            )}
          </S.LineWrapper>
          <S.LegendBelow>
            <S.Spacing>
              <Legend
                heading="Show on graph:"
                keys={ethnicGroupKeys}
                onKeySelect={handleGroupKeySelected}
                showNonHispanic
              />
              <DataSubsetPicker
                label="Year"
                value={year}
                onChange={handleYearSelected}
                options={[YEARS_DEFAULT].concat(chartState.yearRange)}
              />
            </S.Spacing>
          </S.LegendBelow>
        </S.ChartSubsection>
      </S.ChartSection>
    </SearchRateStyled>
  );
}

export default SearchRate;

const TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year',
  },
  {
    Header: 'Stop-reason',
    accessor: 'purpose',
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
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
  {
    Header: 'Asian*',
    accessor: 'asian',
  },
  {
    Header: 'Native American*',
    accessor: 'native_american',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
];
