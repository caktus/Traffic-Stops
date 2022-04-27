import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from 'styled-components';
import * as S from './TableModal.styled';

// Deps
import { CSVLink } from 'react-csv';

// State
import { AGENCY_DETAILS, CONTRABAND_HIT_RATE, STOPS_BY_REASON } from 'Hooks/useDataset';

// Constants
import {PURPOSE_DEFAULT, RACES, reduceFullDatasetOnlyTotals, STOP_TYPES} from 'Components/Charts/chartUtils';

// Hooks
import usePortal from 'Hooks/usePortal';
import useOfficerId from 'Hooks/useOfficerId';
import useYearSet from 'Hooks/useYearSet';

// elements/components
import { P, H2 } from 'styles/StyledComponents/Typography';
import TableSkeleton from 'Components/Elements/Skeletons/TableSkeleton';
import Table from 'Components/Elements/Table/Table';
import { ICONS } from 'img/icons/Icon';
import Button from 'Components/Elements/Button';
import DataSubsetPicker from "../../Charts/ChartSections/DataSubsetPicker/DataSubsetPicker";

const mapDatasetToChartName = {
  STOPS: 'Traffic Stops',
  SEARCHES: 'Searches',
  STOPS_BY_REASON: 'Traffic Stops by Count and Reason',
  SEARCHES_BY_TYPE: 'Searches by Type',
  USE_OF_FORCE: 'Use of Force',
  CONTRABAND_HIT_RATE: 'Contraband Hits',
};

function TableModal({ chartState, dataSet, columns, isOpen, closeModal }) {
  const theme = useTheme();
  const portalTarget = usePortal('modal-root');
  const officerId = useOfficerId();
  const [yearRange] = useYearSet();
  const [purpose, setPurpose] = useState(null);

  const _getEntityReference = () => {
    const agencyName = chartState.data[AGENCY_DETAILS].name;
    if (officerId) return `for Officer ${officerId} of the ${agencyName}`;
    return `for ${agencyName}`;
  };

  // Close modal on "esc" press
  useEffect(() => {
    function _handleKeyUp(e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    }
    document.addEventListener('keyup', _handleKeyUp);
    return () => document.removeEventListener('keyup', _handleKeyUp);
  }, [closeModal]);

  // supress body scrolling behind modal
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = 'visible');
  }, []);

  /* Build some more complicated data sets */
  const mapStopsByPurpose = (ds) => {
    const data = chartState.data[ds];
    let mergedData = [];
    const { searches, stops } = data;
    if (searches && stops) {
      mergedData = searches.map((searchYear, i) => {
        const yearData = {};
        const stopYear = stops[i];
        if (purpose && purpose !== stopYear["purpose"]) {
          return {};
        }
        for (const ethnicGroup in searchYear) {
          if (searchYear.hasOwnProperty(ethnicGroup)) {
            const searchDatum = searchYear[ethnicGroup];
            const stopDatum = stopYear[ethnicGroup];
            if (ethnicGroup === 'year') {
              yearData.year = searchDatum;
            } else {
              yearData[ethnicGroup] = `${stopDatum}`;
            }
          }
        }
        return yearData;
      });
    }
    mergedData = mergedData.filter(e => {
      // Filter out empty objects if a purpose is selected from the dropdown
      return Object.keys(e).length !== 0
    });
    let raceTotals = {
      year: "",
      purpose: "Totals",
      ...reduceFullDatasetOnlyTotals(mergedData, RACES)
    };
    let sortedData = mergedData.sort((a, b) => {
      // Sort data descending by year
      return (a["year"] < b["year"]) ? 1 : ((b["year"] < a["year"]) ? -1 : 0)
    });
    return [raceTotals, ...sortedData];
  };

  const mapSearchesByReason = (ds) => {
    const searches = chartState.data[ds[1]];
    const stops = chartState.data[ds[0]];

    const mergedData = stops.map((yearsStops) => {
      const year = yearsStops.year;
      const yearsSearches = searches.find((s) => s.year === year);
      const comparedData = { year };
      Object.keys(yearsStops).forEach((key) => {
        if (key === 'year') return;
        let groupsSearches;
        if (!yearsSearches) groupsSearches = 0;
        else if (!yearsSearches[key]) groupsSearches = 0;
        else groupsSearches = yearsSearches[key];
        comparedData[key] = `${groupsSearches}/${yearsStops[key]}`;
      });
      return comparedData;
    });
    return mergedData;
  };

  const mapContrbandHitrate = (ds) => {
    const data = chartState.data[ds];
    const { contraband, searches } = data;
    const mappedData = yearRange.map((year) => {
      const hits = contraband.find((d) => d.year === year) || 0;
      const search = searches.find((d) => d.year === year) || 0;
      const comparedData = { year };
      RACES.forEach((r) => {
        comparedData[r] = `${hits[r] || 0}`;
      });
      return comparedData;
    });
    let raceTotals = {
      year: "Totals",
      ...reduceFullDatasetOnlyTotals(mappedData, RACES)
    };
    let sortedData = mappedData.sort((a, b) => {
      // Sort data descending by year
      return (a["year"] < b["year"]) ? 1 : ((b["year"] < a["year"]) ? -1 : 0)
    });
    return [raceTotals, ...sortedData];
  };

  const _buildTableData = (ds) => {
    let data = [];
    if (ds === STOPS_BY_REASON) {
      data = mapStopsByPurpose(ds);
    } else if (ds === CONTRABAND_HIT_RATE) {
      data = mapContrbandHitrate(ds);
    } else if (Array.isArray(ds)) {
      data = mapSearchesByReason(ds);
    } else {
      data = chartState.data[ds];
    }
    return data;
  };

  const _getIsLoading = (ds) => {
    if (Array.isArray(ds)) {
      return ds.some((d) => chartState.loading[d]);
    } else {
      return chartState.loading[ds];
    }
  };

  const _getTableNameForDownload = () => {
    return `${
      Array.isArray(dataSet) ? 'Searches by Percentage' : mapDatasetToChartName[dataSet]
    } ${_getEntityReference()}`;
  };

  // Handle stop purpose dropdown state
  const handleStopPurposeSelect = (p) => {
    if (p === purpose) return;
    if (p === "All") {
      setPurpose(null);
    } else {
      setPurpose(p);
    }
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
          {dataSet == STOPS_BY_REASON &&
            <DataSubsetPicker
                label="Filter by Stop Purpose"
                value={purpose ? purpose : "All"}
                onChange={handleStopPurposeSelect}
                options={[PURPOSE_DEFAULT].concat(STOP_TYPES)}
              />
            }
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
              <CSVLink data={_buildTableData(dataSet)} filename={_getTableNameForDownload()}>
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
