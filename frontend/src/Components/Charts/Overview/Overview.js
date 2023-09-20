import React, { useState, useEffect } from 'react';
import * as S from '../ChartSections/ChartsCommon.styled';
import OverviewStyled from './Overview.styled';
import { useTheme } from 'styled-components';

// Router
import { useHistory, useRouteMatch } from 'react-router-dom';

// Constants
import toTitleCase from '../../../util/toTitleCase';
import {
  calculatePercentage,
  reduceFullDataset,
  YEARS_DEFAULT,
  STATIC_LEGEND_KEYS,
  RACES,
  calculateYearTotal,
} from '../chartUtils';
import * as slugs from '../../../Routes/slugs';

// Hooks
import useMetaTags from '../../../Hooks/useMetaTags';

// Data
import useDataset, {
  AGENCY_DETAILS,
  STOPS,
  SEARCHES,
  USE_OF_FORCE,
} from '../../../Hooks/useDataset';

// Children
import ChartHeader from '../ChartSections/ChartHeader';
import Legend from '../ChartSections/Legend/Legend';
import useOfficerId from '../../../Hooks/useOfficerId';
import Pie from '../ChartPrimitives/Pie';
import DataSubsetPicker from '../ChartSections/DataSubsetPicker/DataSubsetPicker';

function Overview(props) {
  const { agencyId } = props;
  const theme = useTheme();
  const history = useHistory();
  const match = useRouteMatch();
  const officerId = useOfficerId();

  useDataset(agencyId, STOPS);
  useDataset(agencyId, SEARCHES);
  const [chartState] = useDataset(agencyId, USE_OF_FORCE);

  const [year, setYear] = useState(YEARS_DEFAULT);

  const [censusPieData, setCensusPieData] = useState([]);
  const [trafficStopsData, setTrafficStopsData] = useState([]);
  const [searchesData, setSearchesData] = useState([]);
  const [useOfForceData, setUseOfForceData] = useState([]);

  const renderMetaTags = useMetaTags();

  const subjectObserving = () => {
    if (officerId) {
      return 'officer';
    }
    if (agencyId) {
      return 'department';
    }
    return '';
  };

  /* Build Data */
  // CENSUS
  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS].census_profile) {
      const data = chartState.data[AGENCY_DETAILS].census_profile;
      if (Object.keys(data).length === 0) {
        setCensusPieData([]);
        return;
      }
      setCensusPieData(
        RACES.map((race) => ({
          x: toTitleCase(race),
          y: calculatePercentage(data[race], data.total),
          color: theme.colors.ethnicGroup[race],
          fontColor: theme.colors.fontColorsByEthnicGroup[race],
        }))
      );
    }
  }, [chartState.data[AGENCY_DETAILS], year]);

  // TRAFFIC STOPS
  useEffect(() => {
    const data = chartState.data[STOPS];
    if (data) {
      if (!year || year === 'All') {
        setTrafficStopsData(reduceFullDataset(data, RACES, theme));
      } else {
        let yearData = data.filter((d) => d.year === year);
        let total = 0;
        if (yearData.length > 0) {
          // eslint-disable-next-line prefer-destructuring
          yearData = yearData[0];
          total = calculateYearTotal(yearData);
        }
        setTrafficStopsData(
          RACES.map((race) => ({
            x: toTitleCase(race),
            y: calculatePercentage(yearData[race], total),
            color: theme.colors.ethnicGroup[race],
            fontColor: theme.colors.fontColorsByEthnicGroup[race],
          }))
        );
      }
    }
  }, [chartState.data[STOPS], year]);

  // SEARCHES
  useEffect(() => {
    const data = chartState.data[SEARCHES];
    if (data) {
      if (!year || year === 'All') {
        setSearchesData(reduceFullDataset(data, RACES, theme));
      } else {
        let yearData = data.filter((d) => d.year === year);
        let total = 0;
        if (yearData.length > 0) {
          // eslint-disable-next-line prefer-destructuring
          yearData = yearData[0];
          total = calculateYearTotal(yearData);
        }
        setSearchesData(
          RACES.map((race) => ({
            x: toTitleCase(race),
            y: calculatePercentage(yearData[race], total),
            color: theme.colors.ethnicGroup[race],
            fontColor: theme.colors.fontColorsByEthnicGroup[race],
          }))
        );
      }
    }
  }, [chartState.data[SEARCHES], year]);

  // USE OF FORCE
  useEffect(() => {
    const data = chartState.data[USE_OF_FORCE];
    if (data) {
      if (!year || year === 'All') {
        setUseOfForceData(reduceFullDataset(data, RACES, theme));
      } else {
        let yearData = data.filter((d) => d.year === year);
        let total = 0;
        if (yearData.length > 0) {
          // eslint-disable-next-line prefer-destructuring
          yearData = yearData[0];
          total = calculateYearTotal(yearData);
        }
        setUseOfForceData(
          RACES.map((race) => ({
            x: toTitleCase(race),
            y: calculatePercentage(yearData[race], total),
            color: theme.colors.ethnicGroup[race],
            fontColor: theme.colors.fontColorsByEthnicGroup[race],
          }))
        );
      }
    }
  }, [chartState.data[USE_OF_FORCE], year]);

  /* Methods */
  // eslint-disable-next-line no-unused-vars
  const handleYearSelect = (y) => {
    if (y === year) return;
    setYear(y);
  };

  const getPageTitleForShare = () => {
    const agencyName = chartState.data[AGENCY_DETAILS].name;
    return `Traffic Stop statistics for ${agencyName}`;
  };

  const useOfForcePieChartCopy = () => {
    if (officerId) {
      return 'this officer';
    }
    return 'law enforcement officers';
  };

  const buildUrl = (slug) => {
    let url = `${match.url}${slug}`;
    url = url.replace('//', '/');
    if (officerId) url += `/?officer=${officerId}`;
    return history.push(url);
  };

  return (
    <OverviewStyled>
      {renderMetaTags()}
      <ChartHeader
        chartTitle="Overview"
        shareProps={{
          twitterTitle: getPageTitleForShare(),
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <DataSubsetPicker
          label="Year"
          value={year}
          onChange={handleYearSelect}
          options={[YEARS_DEFAULT].concat(chartState.yearRange)}
          dropDown
        />
      </div>
      <S.SectionWrapper />
      <S.ChartsWrapper>
        <S.PieContainer>
          <S.ChartTitle>Census Demographics</S.ChartTitle>
          <S.PieWrapper>
            <Pie loading={chartState.loading[AGENCY_DETAILS]} data={censusPieData} />
            <Legend keys={STATIC_LEGEND_KEYS} isStatic showNonHispanic />
          </S.PieWrapper>
          <S.Note>
            <strong>NOTE: </strong>
            This data reflects the race/ethnic composition based on the most recent census data.
            While it can be used for general comparative purposes, the actual driving population may
            vary significantly from these figures.
          </S.Note>
        </S.PieContainer>
        <S.PieContainer>
          <S.ChartTitle>Traffic Stops</S.ChartTitle>
          <S.PieWrapper>
            <Pie loading={chartState.loading[STOPS]} data={trafficStopsData} />
            <Legend keys={STATIC_LEGEND_KEYS} isStatic showNonHispanic />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers stopped by this {subjectObserving()}.
          </S.Note>
          <S.Link onClick={() => buildUrl(slugs.TRAFFIC_STOPS_SLUG)}>
            View traffic stops over time
          </S.Link>
        </S.PieContainer>
      </S.ChartsWrapper>
      <S.ChartsWrapper>
        <S.PieContainer>
          <S.ChartTitle>Searches</S.ChartTitle>
          <S.PieWrapper>
            <Pie loading={chartState.loading[SEARCHES]} data={searchesData} />
            <Legend keys={STATIC_LEGEND_KEYS} isStatic showNonHispanic />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers searched by this {subjectObserving()}.
          </S.Note>
          <S.Link onClick={() => buildUrl(slugs.SEARCHES_SLUG)}>View searches over time</S.Link>
        </S.PieContainer>
        <S.PieContainer>
          <S.ChartTitle>Use of Force</S.ChartTitle>
          <S.PieWrapper>
            <Pie loading={chartState.loading[USE_OF_FORCE]} data={useOfForceData} />
            <Legend keys={STATIC_LEGEND_KEYS} isStatic showNonHispanic />
          </S.PieWrapper>
          <S.Note>
            Shows the race/ethnic composition of drivers whom {useOfForcePieChartCopy()} reported
            using force against.
          </S.Note>
          <S.Link onClick={() => buildUrl(slugs.USE_OF_FORCE_SLUG)}>
            View use-of-force over time
          </S.Link>
        </S.PieContainer>
      </S.ChartsWrapper>
    </OverviewStyled>
  );
}

export default Overview;
