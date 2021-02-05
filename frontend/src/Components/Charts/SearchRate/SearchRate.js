import React, { useState, useEffect } from 'react';
import { SearchRateStyled } from './SearchRate.styled';
import * as S from 'Components/Charts/ChartSections/ChartsCommon.styled';
import { useTheme } from 'styled-components';

// Router
import { useParams, useHistory } from 'react-router-dom';

// Data
import useDataset, { STOPS_BY_REASON } from 'Hooks/useDataset';

// Hooks
import useOfficerId from 'Hooks/useOfficerId';
import useMetaTags from 'Hooks/useMetaTags';

// Constants
import {
  STATIC_LEGEND_KEYS,
  YEARS_DEFAULT,
  getGroupValueBasedOnYear,
  getRatesAgainstBase,
  STOP_TYPES,
} from '../chartUtils';
import { AGENCY_LIST_SLUG, SEARCHES_SLUG } from 'Routes/slugs';

// Children
import { P } from 'styles/StyledComponents/Typography';
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';
import Legend from 'Components/Charts/ChartSections/Legend/Legend';
import DataSubsetPicker from 'Components/Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';
import GroupedBar from '../ChartPrimitives/GroupedBar';
import { VictoryLabel } from 'victory';

function SearchRate() {
  let { agencyId } = useParams();
  const theme = useTheme();
  const history = useHistory();
  const officerId = useOfficerId();

  const [chartState] = useDataset(agencyId, STOPS_BY_REASON);

  const [year, setYear] = useState(YEARS_DEFAULT);
  const [ethnicGroupKeys, setEthnicGroupKeys] = useState(() =>
    STATIC_LEGEND_KEYS.map((k) => ({ ...k }))
  );

  const [chartData, setChartData] = useState([]);
  const [noBaseSearches, setNoBaseSearches] = useState(false);

  const renderMetaTags = useMetaTags();

  /* BUILD DATA */
  useEffect(() => {
    const data = chartState.data[STOPS_BY_REASON];
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
      } else {
        setNoBaseSearches(false);
      }
      const baseGroupTotalStops = getGroupValueBasedOnYear(data.stops, 'white', year, STOP_TYPES);
      const mappedData = ethnicGroupKeys
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
            })),
          };
        });
      setChartData(mappedData);
    }
  }, [chartState.data[STOPS_BY_REASON], ethnicGroupKeys, year]);

  const _entityHasNoBaseSearches = (baseGroupSearches) => {
    return Object.values(baseGroupSearches).every((v) => v === 0);
  };

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

  const handleViewData = () => {};
  const handleShareGraph = () => {};

  const getSearchesUrlForOfficer = () => {
    return `${AGENCY_LIST_SLUG}/${agencyId}${SEARCHES_SLUG}/?officer=${officerId}`;
  };

  return (
    <SearchRateStyled>
      {renderMetaTags()}
      <S.ChartSection>
        <ChartHeader
          chartTitle="Likelihood of Search"
          handleViewData={handleViewData}
          handleShareGraph={handleShareGraph}
        />
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
        <S.ChartSubsection>
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
                loading={chartState.loading[STOPS_BY_REASON]}
                horizontal
                iAxisProps={{
                  tickLabelComponent: <VictoryLabel x={100} dx={-50} style={{ fontSize: 6 }} />,
                  tickFormat: (t) => (t.split ? t.split(' ') : t),
                }}
                chartProps={{
                  height: 500,
                  width: 400,
                }}
                barProps={{
                  barWidth: 10,
                }}
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
