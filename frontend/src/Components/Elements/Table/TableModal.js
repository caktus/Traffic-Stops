import React, { forwardRef, useEffect, useState } from 'react';
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
  STOPS,
  STOPS_BY_REASON,
  SEARCHES,
  USE_OF_FORCE,
  LIKELIHOOD_OF_STOP,
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
import { useParams } from 'react-router-dom';
import mapDatasetKeyToEndpoint from '../../../Services/endpoints';
import axios from '../../../Services/Axios';
import * as ChartHeaderStyles from '../../Charts/ChartSections/ChartHeader.styled';
import range from 'lodash.range';
import displayMissingPhrase from '../../../util/displayMissingData';
import DatePicker from 'react-datepicker';
import { getRangeValues } from '../../../util/range';

const mapDatasetToChartName = {
  STOPS: 'Traffic Stops By Percentage',
  SEARCHES: 'Searches',
  STOPS_BY_REASON: 'Traffic Stops by Count',
  SEARCHES_BY_TYPE: 'Searches by Count',
  USE_OF_FORCE: 'Use of Force',
  CONTRABAND_HIT_RATE: 'Contraband "Hit Rate"',
  LIKELIHOOD_OF_SEARCH: 'Likelihood of Search',
  LIKELIHOOD_OF_STOP: 'Likelihood of Stop',
};

const mapDataSetToEnum = {
  STOPS,
  SEARCHES,
  STOPS_BY_REASON,
  SEARCHES_BY_TYPE,
  USE_OF_FORCE,
  CONTRABAND_HIT_RATE,
  LIKELIHOOD_OF_SEARCH,
  LIKELIHOOD_OF_STOP,
};

function TableModal({ chartState, dataSet, columns, isOpen, closeModal }) {
  const { agencyId } = useParams();
  const theme = useTheme();
  const portalTarget = usePortal('modal-root');
  const officerId = useOfficerId();
  let [yearRange] = useYearSet();
  const [purpose, setPurpose] = useState(null);
  const [consolidateYears, setConsolidateYears] = useState(false);
  const [rangeValue, setRangeValue] = useState(getRangeValues(true));
  const [dateInterval, setDateInterval] = useState('year');
  const [tableReloading, setReloading] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const tableChartState = chartState;
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const _getEntityReference = () => {
    const agencyName = tableChartState.data[AGENCY_DETAILS].name;
    if (officerId) return `for Officer ${officerId} of the ${agencyName}`;
    return `for ${agencyName}`;
  };

  const stopTypes = (ds) => {
    let stops = [PURPOSE_DEFAULT].concat(STOP_TYPES);
    if (ds === STOPS_BY_REASON) {
      stops = stops.filter((st) => st !== 'Average');
    }
    return stops;
  };

  // Close modal on "esc" press
  useEffect(() => {
    function _handleKeyUp(e) {
      if (e.key === 'Escape') {
        document.body.style.overflow = 'visible';
        closeRangePicker();
        closeModal();
      }
    }

    document.addEventListener('keyup', _handleKeyUp);
    return () => document.removeEventListener('keyup', _handleKeyUp);
  }, [closeModal]);

  const cleanMonthlyData = (data) =>
    data
      .filter((d) => !d.hasOwnProperty('year'))
      .map((d) => {
        const row = d;
        row['year'] = row['date'];
        delete row['date'];
        return row;
      });

  useEffect(() => {
    let tableDS = mapDataSetToEnum[dataSet];
    if (Array.isArray(dataSet)) {
      tableDS = mapDataSetToEnum[dataSet[1]];
    }
    const _fetchData = async () => {
      setReloading(true);
      const getEndpoint = mapDatasetKeyToEndpoint(tableDS);
      const _from = `${rangeValue.from.year}-${rangeValue.from.month.toString().padStart(2, 0)}-01`;
      const _to = `${rangeValue.to.year}-${rangeValue.to.month.toString().padStart(2, 0)}-01`;
      let url = `${getEndpoint(agencyId)}?from=${_from}&to=${_to}`;
      if (officerId) {
        url = `${url}&officer=${officerId}`;
      }
      yearRange = range(rangeValue.from.year, rangeValue.to.year + 1, 1);
      try {
        const { data } = await axios.get(url);
        let tableData = data;
        if (yearRange.length <= 3) {
          setDateInterval('month');
          // Needs to show the monthly range dates in the 'year' column
          if (tableDS === STOPS_BY_REASON || tableDS === LIKELIHOOD_OF_SEARCH) {
            tableData.stops = cleanMonthlyData(tableData.stops);
            tableData.searches = cleanMonthlyData(tableData.searches);
          } else if (tableDS === CONTRABAND_HIT_RATE) {
            tableData.contraband = cleanMonthlyData(tableData.contraband);
          } else {
            tableData = cleanMonthlyData(tableData);
          }
        } else {
          setDateInterval('year');
        }
        tableChartState.yearRange = yearRange;
        tableChartState.data[tableDS] = tableData;
        setReloading(false);
      } catch (err) {
        setReloading(false);
      }
    };
    if (dataSet) {
      _fetchData();
    }
  }, [dataSet, rangeValue.from, rangeValue.to]);

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
      const placeholderValue = {
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
        placeholderValue.purpose = purpose;
      }
      if (hasSearchType) {
        placeholderValue.search_type = purpose;
      }
      // If the date range picker isn't active, add the missing year data,
      // otherwise only add it if the year is in the date range selected.
      if (mergedData.filter((y) => y.year === year).length === 0) {
        if (!showDateRangePicker) {
          mergedData.push(placeholderValue);
        } else if (
          showDateRangePicker &&
          year >= rangeValue.from.year &&
          year <= rangeValue.to.year
        ) {
          mergedData.push(placeholderValue);
        }
      }
    }
  };

  /* Build some more complicated data sets */
  const mapStopsByPurpose = (ds) => {
    const data = tableChartState.data[ds];
    let mergedData = [];
    const { searches, stops } = data;
    if (searches && stops) {
      if (consolidateYears && !purpose) {
        mergedData = reduceEthnicityByYears(stops, tableChartState.yearRange);
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
      if (dateInterval === 'year') {
        markMissingYears(mergedData);
      }
    }

    const raceTotals = {
      year: '',
      purpose: 'Totals',
      ...reduceFullDatasetOnlyTotals(mergedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mergedData, RACES)),
    };

    let tableData = mergedData;
    if (dateInterval === 'year') {
      tableData = mergedData.sort((a, b) =>
        // Sort data descending by year
        // eslint-disable-next-line no-nested-ternary
        a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
      );
    }
    return [raceTotals, ...tableData];
  };

  const mapLikelihoodOfSearch = (ds) => {
    const data = tableChartState.data[ds];
    let mergedData = [];
    const { searches, stops } = data;
    if (searches && stops) {
      if (consolidateYears && !purpose) {
        mergedData = reduceEthnicityByYears(searches, tableChartState.yearRange);
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
      if (dateInterval === 'year') {
        markMissingYears(mergedData);
      }
    }

    const raceTotals = {
      year: '',
      purpose: 'Totals',
      ...reduceFullDatasetOnlyTotals(mergedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mergedData, RACES)),
    };
    let tableData = mergedData;
    if (dateInterval === 'year') {
      tableData = mergedData.sort((a, b) =>
        // Sort data descending by year
        // eslint-disable-next-line no-nested-ternary
        a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
      );
    }
    return [raceTotals, ...tableData];
  };

  const mapSearchesByReason = (ds) => {
    const searches = tableChartState.data[ds[1]];

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
    if (dateInterval === 'year') {
      markMissingYears(mergedData, false);
    }

    const raceTotals = {
      year: 'Totals',
      ...reduceFullDatasetOnlyTotals(mergedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mergedData, RACES)),
    };
    let tableData = mergedData;
    if (dateInterval === 'year') {
      tableData = mergedData.sort((a, b) =>
        // Sort data descending by year
        // eslint-disable-next-line no-nested-ternary
        a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
      );
    }
    return [raceTotals, ...tableData];
  };

  const mapContrbandHitrate = (ds) => {
    const data = tableChartState.data[ds];
    const { contraband } = data;
    const yearRangeMap =
      dateInterval === 'month' ? contraband.map((c) => c.year) : tableChartState.yearRange;
    const mappedData = yearRangeMap.map((year) => {
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
    let tableData = mappedData;
    if (dateInterval === 'year') {
      tableData = mappedData.sort((a, b) =>
        // Sort data descending by year
        // eslint-disable-next-line no-nested-ternary
        a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
      );
    }
    return [raceTotals, ...tableData];
  };

  const mapSearchByType = (ds) => {
    const data = tableChartState.data[ds];
    // eslint-disable-next-line no-param-reassign,no-return-assign
    data.forEach((datum) => (datum['total'] = calculateYearTotal(datum)));
    let mappedData = [];
    if (consolidateYears && !purpose) {
      mappedData = reduceEthnicityByYears(data, tableChartState.yearRange);
    } else if (purpose) {
      mappedData = data.filter((d) => d.search_type === purpose);
    } else {
      mappedData = data;
    }
    if (dateInterval === 'year') {
      markMissingYears(mappedData, false, true);
    }
    const raceTotals = {
      year: 'Totals',
      search_type: '',
      ...reduceFullDatasetOnlyTotals(mappedData, RACES),
      total: calculateYearTotal(reduceFullDatasetOnlyTotals(mappedData, RACES)),
    };
    let tableData = mappedData;
    if (dateInterval === 'year') {
      tableData = mappedData.sort((a, b) =>
        // Sort data descending by year
        // eslint-disable-next-line no-nested-ternary
        a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
      );
    }
    return [raceTotals, ...tableData];
  };

  const _buildTableData = (ds) => {
    const formatDecmials = (value) => {
      return typeof value === 'number' ? value.toFixed(2) : value;
    };

    let data;
    let chartData;
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
    } else if (ds === LIKELIHOOD_OF_STOP) {
      chartData = tableChartState.data[ds].table_data;
      chartData = chartData.map((chartDatum) => ({
        ...chartDatum,
        ...Object.fromEntries(
          Object.entries(chartDatum).map(([key, value]) => [
            key,
            typeof value === 'number' ? parseFloat(value.toFixed(2)) : value,
          ]),
        ),
      }));
      // eslint-disable-next-line no-param-reassign,no-return-assign
      chartData.forEach((chartDatum) => (chartDatum['total'] = calculateYearTotal(chartDatum)));
      return chartData;
    } else {
      chartData = tableChartState.data[ds];
      // eslint-disable-next-line no-param-reassign,no-return-assign
      chartData.forEach((chartDatum) => (chartDatum['total'] = calculateYearTotal(chartDatum)));

      if (dateInterval === 'year') {
        markMissingYears(chartData, false);
      }

      const raceTotals = {
        year: 'Totals',
        ...reduceFullDatasetOnlyTotals(chartData, RACES),
        total: calculateYearTotal(reduceFullDatasetOnlyTotals(chartData, RACES)),
      };

      let tableData = chartData;
      if (dateInterval === 'year') {
        tableData = chartData.sort((a, b) =>
          // Sort data descending by year
          // eslint-disable-next-line no-nested-ternary
          a['year'] < b['year'] ? 1 : b['year'] < a['year'] ? -1 : 0
        );
      }
      data = [raceTotals, ...tableData];
    }
    return data;
  };

  const setupCSVData = (ds) => {
    let csvData;
    if (ds === LIKELIHOOD_OF_STOP) {
      csvData = _buildTableData(ds);
      return JSON.stringify(csvData);
    }
    csvData = JSON.parse(JSON.stringify(_buildTableData(ds)));
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
        datum[placeholderCol] = displayMissingPhrase(ds);
        // eslint-disable-next-line no-param-reassign
        datum['year'] = year;
      }
    });
    return csvData;
  };

  const _getIsLoading = (ds) => {
    if (Array.isArray(ds)) {
      return ds.some((d) => tableChartState.loading[d]);
    }
    return tableChartState.loading[ds];
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
      return `${message} found with contraband during a stop totaled by year.`;
    }
    if (ds === LIKELIHOOD_OF_SEARCH) {
      if (consolidateYears) {
        return `${message} searched during a stop totaled by year.`;
      }
      return `${message} searched during a specific stop reason.`;
    }
    if (ds === STOPS_BY_REASON) {
      if (consolidateYears) {
        return `${message} stopped totaled by year.`;
      }
      return `${message} stopped for a specific reason.`;
    }
    if (ds === LIKELIHOOD_OF_STOP) {
      return `${message} stopped relative to their population,
      showing stop rates and disparities compared to white drivers.`;
    }
    return '';
  };

  const closeRangePicker = () => {
    setShowDateRangePicker(false);
    setRangeValue(getRangeValues(true));
    setStartDate(new Date());
    setEndDate(new Date());
  };

  const closeModalAndCleanup = () => {
    closeRangePicker();
    closeModal();
  };

  const MonthPickerButton = forwardRef(({ value, onClick }, ref) => (
    <Button onClick={onClick} ref={ref}>
      {value}
    </Button>
  ));

  const onDateRangeChange = (dates) => {
    // eslint-disable-next-line prefer-const
    let [start, end] = dates;

    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      // Update range value on when valid start/end dates are selected
      setRangeValue({
        from: { month: start.getMonth() + 1, year: start.getFullYear() },
        to: { month: end.getMonth() + 1, year: end.getFullYear() },
      });
    }
  };

  return ReactDOM.createPortal(
    isOpen && (
      <>
        <S.ModalUnderlay onClick={closeModalAndCleanup} />
        <S.TableModal>
          <S.Header>
            <S.Heading>
              <H2>
                {Array.isArray(dataSet) ? 'Searches by Percentage' : mapDatasetToChartName[dataSet]}
              </H2>
              <P> {_getEntityReference()}</P>
            </S.Heading>
            <S.CloseButton
              onClick={closeModalAndCleanup}
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
            <S.BottomMarginTen>
              <DataSubsetPicker
                label="Filter by Stop Purpose"
                value={purpose || 'All'}
                onChange={handleStopPurposeSelect}
                options={stopTypes(dataSet)}
              />
            </S.BottomMarginTen>
          )}
          {dataSet === SEARCHES_BY_TYPE && (
            <S.BottomMarginTen>
              <DataSubsetPicker
                label="Filter by Search Type"
                value={purpose || 'All'}
                onChange={handleStopPurposeSelect}
                options={[PURPOSE_DEFAULT].concat(SEARCH_TYPES)}
              />
            </S.BottomMarginTen>
          )}
          {!showDateRangePicker && dataSet !== 'LIKELIHOOD_OF_STOP' && (
            <Button
              variant="positive"
              marginTop={10}
              {...S.ButtonInlines}
              onClick={() => setShowDateRangePicker(true)}
            >
              Filter by date range
            </Button>
          )}
          {showDateRangePicker && (
            <div style={{ display: 'flex', flexDirection: 'row', marginTop: '10' }}>
              <div style={{ width: '200px' }}>
                <DatePicker
                  selected={startDate}
                  onChange={onDateRangeChange}
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={new Date()}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  selectsRange
                  customInput={<MonthPickerButton />}
                  popperPlacement="bottom-end"
                  monthClassName={() => 'fj-date-range-month'}
                />
              </div>
              <Button
                variant="positive"
                backgroundColor="white"
                width={25}
                height={25}
                onClick={closeRangePicker}
              >
                <ChartHeaderStyles.Icon
                  icon={ICONS.close}
                  width={25}
                  height={25}
                  fill={theme.colors.positive}
                />
              </Button>
            </div>
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
            {_getIsLoading(dataSet) || tableReloading ? (
              <TableSkeleton />
            ) : (
              <Table
                data={_buildTableData(dataSet)}
                datasetName={dataSet}
                columns={columns}
                pageSize={10}
                paginated
              />
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
    portalTarget,
  );
}

export default TableModal;
