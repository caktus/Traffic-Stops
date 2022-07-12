import React, { useEffect, useState } from 'react';
import * as S from './FindAStopResults.styled';
import { AnimatePresence, motion } from 'framer-motion';

// Routing
import { useNavigate, useLocation } from 'react-router-dom';
import { FIND_A_STOP_SLUG, AGENCY_LIST_SLUG } from 'Routes/slugs';

// AJAX
import axios from 'Services/Axios';
import { FIND_A_STOP_URL } from 'Services/endpoints';

// Children
import { H1, H2, P, SIZES, COLORS } from 'styles/StyledComponents/Typography';
import TableSkeleton from 'Components/Elements/Skeletons/TableSkeleton';
import BackButton from 'Components/Elements/BackButton';
import Table from 'Components/Elements/Table/Table';

const MAX_STOPS_RESULTS = 100;

const tableColumns = [
  {
    Header: 'Date + Time',
    accessor: 'date', // accessor is the "key" in the data
  },
  {
    Header: 'Gender',
    accessor: 'gender',
  },
  {
    Header: 'Race',
    accessor: 'race',
  },
  {
    Header: 'Ethnicity',
    accessor: 'ethnicity',
  },
  {
    Header: 'Age',
    accessor: 'age',
  },
  {
    Header: 'Department',
    accessor: 'department',
  },
  {
    Header: 'Officer ID',
    accessor: 'officer_id',
  },
];

function FindAStopResults() {
  const { search } = useLocation();
  const history = useNavigate();

  const [stops, setStops] = useState();

  useEffect(() => {
    async function _fetchStops() {
      try {
        const { data } = await axios.get(`${FIND_A_STOP_URL}${search}`);
        setStops(data.results);
      } catch (e) {
        console.warn(e);
      }
    }
    _fetchStops();
  }, [search]);

  const _getAgencyURLFromQueryString = () => {
    const qp = new URLSearchParams(search);
    const agencyId = qp.get('agency');
    return `${AGENCY_LIST_SLUG}/${agencyId}/`;
  };

  const handleOfficerIdSelected = (officerId) => {
    history.push({
      pathname: _getAgencyURLFromQueryString(),
      search: `officer=${officerId}`,
    });
  };

  return (
    <S.Page>
      <S.Heading>
        <BackButton to={FIND_A_STOP_SLUG} text="Back to Search" />
        <H1>Stops</H1>
        {stops?.length > 0 && (
          <P size={SIZES[0]} color={COLORS[0]}>
            {stops.length === MAX_STOPS_RESULTS
              ? `Returned maximum number of results (${MAX_STOPS_RESULTS}). Try limiting your search`
              : `${stops.length} results found`}
          </P>
        )}
      </S.Heading>
      <S.TableContainer>
        {!stops && <TableSkeleton />}
        {stops?.length === 0 && (
          <S.NoResults>
            <H2>No stops matching these criteria have been reported to the SBI.</H2>
            <P>
              Has{' '}
              <S.DeptLink onClick={() => history.push(_getAgencyURLFromQueryString())}>
                this department
              </S.DeptLink>{' '}
              reported stops within your date range?
            </P>
          </S.NoResults>
        )}
        {stops?.length > 0 && (
          <AnimatePresence>
            <motion.div
              key="StopsTable"
              initial={{ opacity: 0.35, x: 100, duration: 750 }}
              animate={{ opacity: 1, x: 0, duration: 750 }}
              exit={{ opacity: 0.35, x: 100, duration: 750 }}
              transition={{ ease: 'easeIn' }}
            >
              <S.TableWrapper>
                <Table
                  data={stops}
                  columns={tableColumns}
                  paginated
                  sortable
                  handleOfficerIdSelected={handleOfficerIdSelected}
                />
              </S.TableWrapper>
            </motion.div>
          </AnimatePresence>
        )}
      </S.TableContainer>
    </S.Page>
  );
}

export default FindAStopResults;
