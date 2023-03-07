import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from 'styled-components';
import * as S from './TableModal.styled';

// Deps
import { CSVLink } from 'react-csv';

// State
import {
  AGENCY_DETAILS,
  CONTRABAND_HIT_RATE,
  LIKELIHOOD_OF_SEARCH,
  SEARCHES_BY_TYPE,
  STOPS_BY_REASON,
} from '../../../Hooks/useDataset';

// Constants
import {
  PURPOSE_DEFAULT,
  RACES,
  reduceFullDatasetOnlyTotals,
  STOP_TYPES,
  SEARCH_TYPES,
  reduceEthnicityByYears,
  calculateYearTotal,
} from '../../Charts/chartUtils';

// Hooks
import usePortal from '../../../Hooks/usePortal';
import useOfficerId from '../../../Hooks/useOfficerId';
import useYearSet from '../../../Hooks/useYearSet';

// elements/components
import { H2, P } from '../../../styles/StyledComponents/Typography';
import TableSkeleton from '../Skeletons/TableSkeleton';
import Table from './Table';
import { ICONS } from '../../../img/icons/Icon';
import Button from '../Button';
import DataSubsetPicker from '../../Charts/ChartSections/DataSubsetPicker/DataSubsetPicker';
import Checkbox from '../Inputs/Checkbox';

const mapDatasetToChartName = {
  STOPS: 'Traffic Stops By Percentage',
  SEARCHES: 'Searches',
  STOPS_BY_REASON: 'Traffic Stops by Count',
  SEARCHES_BY_TYPE: 'Searches by Count',
  USE_OF_FORCE: 'Use of Force',
  CONTRABAND_HIT_RATE: 'Contraband "Hit Rate"',
  LIKELIHOOD_OF_SEARCH: 'Likelihood of Search',
};

function TableModal({ chartState, dataSet, columns, isOpen, closeModal }) {
  const theme = useTheme();
  const portalTarget = usePortal('modal-root');
  const officerId = useOfficerId();
  const [yearRange] = useYearSet();
  const [purpose, setPurpose] = useState(null);
  const [consolidateYears, setConsolidateYears] = useState(false);

  const _getEntityReference = () => {
    const agencyName = chartState.data[AGENCY_DETAILS].name;
    if (officerId) return `for Officer ${officerId} of the ${agencyName}`;
    return `for ${agencyName}`;
  };

  // Close modal on "esc" press
  useEffect(() => {
    function _handleKeyUp(e) {
      if (e.key === 'Escape') {
        document.body.style.overflow = 'visible';
        closeModal();
      }
    }

    document.addEventListener('keyup', _handleKeyUp);
    return () => document.removeEventListener('keyup', _handleKeyUp);
  }, [closeModal]);

  // supress body scrolling behind modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    // eslint-disable-next-line no-return-assign
    return () => (document.body.style.overflow = 'visible');
  }, [isOpen]);

  const markMissingYears = (mergedData, hasPurpose = true, hasSearchType = false) => {
    // hasPurpose is meant for datasets that has a dedicated column for purpose, some may not
    // hasSearchType is meant for specific datasets that include a search type and not a purpose
    for (let i = 0; i < yearRange.length; i++) {
      const year = yearRange[i];
      if (mergedData.filter((y) => y.year === year).length === 0) {
        const data = {
          year,
          no_data: true,
          asian: 0,
          black: 0,
          hispanic: 0,
          native_american: 0,
          other: 0,
          total: 0,
          white: 0,
        };
        if (hasPurpose) {
          data.purpose = purpose;
        }
        if (hasSearchType) {
          data.search_type = purpose;
        }
        mergedData.push(data);
      }
    }
  };

  /* Build some more complicated data sets */
  const mapStopsByPurpose = (ds) => {
    const data = chartState.data[ds];
    let mergedData = [];
    const { searches, stops } = data;
    if (searches && stops) {
      if (consolidateYears && !purpose) {
        mergedData = reduceEthnicityByYears(stops, chartState.yearRange);
      } else {
        mergedData = stops.map((searchYear, i) => {
          const yearData = {};
          const stopYear = stops[i];
          // eslint-disable-next-line no-restricted-syntax
          for (const ethnicGroup in searchYear) {
            if (searchYear.hasOwnProperty(ethnicGroup)) {
              const searchDatum = searchYear[ethnicGroup];
              const stopDatum = stopYear[ethnicGroup];
              if (ethnicGroup === 'year') {
                yearData.year = searchDatum;
              } else {
                yearData[ethnicGroup] = stopDatum;
              }
            }
          }
          yearData['total'] = calculateYearTotal(yearData);
          return yearData;
        });
        if (purpose) {
          mergedData = mergedData.filter((e) => e.purpose === purpose);
        }
      }
      markMissingYears(mergedData);
    }

    const raceTotals = {
      year: '',
      purpose: 'Totals',
      ...reduceFullDatasetOnlyTotals(mergedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mergedData, RACES)),
    };
    const sortedData = mergedData.sort((a, b) =>
      // Sort data descending by year
      // eslint-disable-next-line no-nested-ternary
      a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
    );
    return [raceTotals, ...sortedData];
  };

  const mapLikelihoodOfSearch = (ds) => {
    const data = chartState.data[ds];
    let mergedData = [];
    const { searches, stops } = data;
    if (searches && stops) {
      if (consolidateYears && !purpose) {
        mergedData = reduceEthnicityByYears(searches, chartState.yearRange);
      } else {
        mergedData = searches.map((searchYear) => {
          const yearData = {};
          // eslint-disable-next-line no-restricted-syntax
          for (const ethnicGroup in searchYear) {
            if (searchYear.hasOwnProperty(ethnicGroup)) {
              const searchDatum = searchYear[ethnicGroup];
              if (ethnicGroup === 'year') {
                yearData.year = searchDatum;
              } else {
                yearData[ethnicGroup] = searchDatum;
              }
            }
          }
          yearData['total'] = calculateYearTotal(yearData);
          return yearData;
        });
        if (purpose) {
          mergedData = mergedData.filter((e) => e.purpose === purpose);
        }
      }
      markMissingYears(mergedData);
    }

    const raceTotals = {
      year: '',
      purpose: 'Totals',
      ...reduceFullDatasetOnlyTotals(mergedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mergedData, RACES)),
    };
    const sortedData = mergedData.sort((a, b) =>
      // Sort data descending by year
      // eslint-disable-next-line no-nested-ternary
      a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
    );
    return [raceTotals, ...sortedData];
  };

  const mapSearchesByReason = (ds) => {
    const searches = chartState.data[ds[1]];

    let mergedData = searches.map((yearsStops) => {
      const { year } = yearsStops;
      const yearsSearches = searches.find((s) => s.year === year);
      const comparedData = { year };
      Object.keys(yearsStops).forEach((key) => {
        if (key === 'year') return;
        let groupsSearches;
        if (!yearsSearches) groupsSearches = 0;
        else if (!yearsSearches[key]) groupsSearches = 0;
        else groupsSearches = yearsSearches[key];
        comparedData[key] = groupsSearches;
      });
      comparedData['total'] = calculateYearTotal(comparedData);
      return comparedData;
    });
    if (purpose) {
      mergedData = mergedData.filter((e) => e.purpose === purpose);
    }
    markMissingYears(mergedData, false);
    const raceTotals = {
      year: 'Totals',
      ...reduceFullDatasetOnlyTotals(mergedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mergedData, RACES)),
    };
    const sortedData = mergedData.sort((a, b) =>
      // Sort data descending by year
      // eslint-disable-next-line no-nested-ternary
      a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
    );
    return [raceTotals, ...sortedData];
  };

  const mapContrbandHitrate = (ds) => {
    const data = chartState.data[ds];
    const { contraband } = data;
    const mappedData = yearRange.map((year) => {
      const hits = contraband.find((d) => d.year === year) || 0;
      const comparedData = { year };
      if (!hits) {
        comparedData['no_data'] = true;
      }
      RACES.forEach((r) => {
        comparedData[r] = hits[r] || 0;
      });
      comparedData['total'] = calculateYearTotal(comparedData);
      return comparedData;
    });
    const raceTotals = {
      year: 'Totals',
      ...reduceFullDatasetOnlyTotals(mappedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mappedData, RACES)),
    };
    const sortedData = mappedData.sort((a, b) =>
      // Sort data descending by year
      // eslint-disable-next-line no-nested-ternary
      a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
    );
    return [raceTotals, ...sortedData];
  };

  const mapSearchByType = (ds) => {
    const data = chartState.data[ds];
    // eslint-disable-next-line no-param-reassign,no-return-assign
    data.forEach((datum) => (datum['total'] = calculateYearTotal(datum)));
    let mappedData = [];
    if (consolidateYears && !purpose) {
      mappedData = reduceEthnicityByYears(data, chartState.yearRange);
    } else if (purpose) {
      mappedData = data.filter((d) => d.search_type === purpose);
    } else {
      mappedData = data;
    }
    markMissingYears(mappedData, false, true);
    const raceTotals = {
      year: 'Totals',
      search_type: '',
      ...reduceFullDatasetOnlyTotals(mappedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mappedData, RACES)),
    };
    const sortedData = mappedData.sort((a, b) =>
      // Sort data descending by year
      // eslint-disable-next-line no-nested-ternary
      a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
    );
    return [raceTotals, ...sortedData];
  };

  const _buildTableData = (ds) => {
    let data;
    if (ds === STOPS_BY_REASON) {
      data = mapStopsByPurpose(ds);
    } else if (ds === CONTRABAND_HIT_RATE) {
      data = mapContrbandHitrate(ds);
    } else if (ds === LIKELIHOOD_OF_SEARCH) {
      data = mapLikelihoodOfSearch(ds);
    } else if (ds === SEARCHES_BY_TYPE) {
      data = mapSearchByType(ds);
    } else if (Array.isArray(ds)) {
      data = mapSearchesByReason(ds);
    } else {
      const chartData = chartState.data[ds];
      // eslint-disable-next-line no-param-reassign,no-return-assign
      chartData.forEach((chartDatum) => (chartDatum['total'] = calculateYearTotal(chartDatum)));
      markMissingYears(chartData, false);
      const raceTotals = {
        year: 'Totals',
        ...reduceFullDatasetOnlyTotals(chartData, RACES),
        total: calculateYearTotal(reduceFullDatasetOnlyTotals(chartData, RACES)),
      };
      const sortedData = chartData.sort((a, b) =>
        // Sort data descending by year
        // eslint-disable-next-line no-nested-ternary
        a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
      );
      data = [raceTotals, ...sortedData];
    }
    return data;
  };

  const missingPhraseForGraph = (ds) => {
    const phrase = {
      STOPS: 'stops',
      SEARCHES: 'searches',
      STOPS_BY_REASON: 'stops',
      SEARCHES_BY_TYPE: 'searches',
      USE_OF_FORCE: 'use of force',
      CONTRABAND_HIT_RATE: 'contraband',
      LIKELIHOOD_OF_SEARCH: 'searches',
    }[ds];
    return `No ${phrase} have been reported`;
  };

  const setupCSVData = (ds) => {
    const csvData = JSON.parse(JSON.stringify(_buildTableData(ds)));
    // Cleanup data tables for spreadsheet download
    csvData.forEach((datum) => {
      if (datum.hasOwnProperty('no_data') && datum.no_data) {
        // eslint-disable-next-line no-param-reassign
        delete datum['no_data'];
        // Little hack to place the missing data phrase next to the year column;
        let placeholderCol = 'white';
        if (datum.hasOwnProperty('purpose')) {
          placeholderCol = 'purpose';
        } else if (datum.hasOwnProperty('search_type')) {
          placeholderCol = 'search_type';
        }
        // eslint-disable-next-line prefer-destructuring
        const year = datum['year'];
        // eslint-disable-next-line guard-for-in,no-restricted-syntax
        for (const property in datum) {
          // eslint-disable-next-line no-param-reassign
          datum[property] = null;
        }
        // eslint-disable-next-line no-param-reassign
        datum[placeholderCol] = missingPhraseForGraph(ds);
        // eslint-disable-next-line no-param-reassign
        datum['year'] = year;
      }
    });
    return csvData;
  };

  const _getIsLoading = (ds) => {
    if (Array.isArray(ds)) {
      return ds.some((d) => chartState.loading[d]);
    }
    return chartState.loading[ds];
  };

  const _getTableNameForDownload = () =>
    `${
      Array.isArray(dataSet) ? 'Searches by Percentage' : mapDatasetToChartName[dataSet]
    } ${_getEntityReference()}`;

  // Handle stop purpose dropdown state
  const handleStopPurposeSelect = (p) => {
    if (p === purpose) return;
    if (p === 'All') {
      setConsolidateYears(null);
      setPurpose(null);
    } else {
      setConsolidateYears(null);
      setPurpose(p);
    }
  };

  const showConsolidateYearsSwitch = (ds) => {
    if (purpose) {
      return false;
    }
    return ds === STOPS_BY_REASON || ds === LIKELIHOOD_OF_SEARCH || ds === SEARCHES_BY_TYPE;
  };

  const subheadingForDataset = (ds) => {
    const message = 'The following data correspond to the number of times each race was';
    if (ds === CONTRABAND_HIT_RATE) {
      return `${message} found with contraband during a stop totalled by year.`;
    }
    if (ds === LIKELIHOOD_OF_SEARCH) {
      if (consolidateYears) {
        return `${message} searched during a stop totalled by year.`;
      }
      return `${message} searched during a specific stop reason.`;
    }
    if (ds === STOPS_BY_REASON) {
      if (consolidateYears) {
        return `${message} stopped totalled by year.`;
      }
      return `${message} stopped for a specific reason.`;
    }
    return '';
  };

  return ReactDOM.createPortal(
    isOpen && (
      <>
        <S.ModalUnderlay onClick={closeModal} />
        <S.TableModal>
          <S.Header>
            <S.Heading>
              <H2>
                {Array.isArray(dataSet) ? 'Searches by Percentage' : mapDatasetToChartName[dataSet]}
              </H2>
              <P> {_getEntityReference()}</P>
            </S.Heading>
            <S.CloseButton
              onClick={closeModal}
              icon={ICONS.close}
              fill={theme.colors.primary}
              width={42}
              height={42}
            />
          </S.Header>
          <S.Heading>
            <P>{subheadingForDataset(dataSet)}</P>
          </S.Heading>
          {(dataSet === STOPS_BY_REASON || dataSet === LIKELIHOOD_OF_SEARCH) && (
            <DataSubsetPicker
              label="Filter by Stop Purpose"
              value={purpose || 'All'}
              onChange={handleStopPurposeSelect}
              options={[PURPOSE_DEFAULT].concat(STOP_TYPES)}
            />
          )}
          {dataSet === SEARCHES_BY_TYPE && (
            <DataSubsetPicker
              label="Filter by Search Type"
              value={purpose || 'All'}
              onChange={handleStopPurposeSelect}
              options={[PURPOSE_DEFAULT].concat(SEARCH_TYPES)}
            />
          )}
          {showConsolidateYearsSwitch(dataSet) && (
            <Checkbox
              label="Consolidate years"
              value={consolidateYears}
              key="consolidate_years"
              checked={consolidateYears}
              onChange={() => setConsolidateYears(!consolidateYears)}
            />
          )}
          <S.TableWrapper>
            {_getIsLoading(dataSet) ? (
              <TableSkeleton />
            ) : (
              <Table data={_buildTableData(dataSet)} columns={columns} pageSize={10} paginated />
            )}
          </S.TableWrapper>
          <S.NonHispanic>* Non-hispanic</S.NonHispanic>
          {!_getIsLoading(dataSet) && (
            <S.Download>
              <CSVLink data={setupCSVData(dataSet)} filename={_getTableNameForDownload()}>
                <Button variant="positive" {...S.ButtonInlines} onClick={() => {}}>
                  <S.Icon icon={ICONS.download} height={25} width={25} fill={theme.colors.white} />
                  Download Data
                </Button>
              </CSVLink>
            </S.Download>
          )}
        </S.TableModal>
      </>
    ),
    portalTarget
  );
}

export default TableModal;
