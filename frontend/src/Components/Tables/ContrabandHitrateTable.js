import React from 'react';

// Components
import Table from 'Components/Elements/Table/Table';

function ContrabandHitrateTable({ data }) {
  const columns = React.useMemo(
    () => [
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
    ],
    []
  );

  const mappedData = React.useMemo(() => {
    let mergedData = [];
    if (data) {
      const { contraband, searches } = data;
      mergedData = searches.map((searchYear, i) => {
        const yearData = {};
        const contrabandYear = contraband[i];
        for (const ethnicGroup in searchYear) {
          if (searchYear.hasOwnProperty(ethnicGroup)) {
            const searchDatum = searchYear[ethnicGroup];
            const contrabandDatum = contrabandYear[ethnicGroup];
            if (ethnicGroup === 'year') {
              yearData.year = searchDatum;
            } else {
              yearData[ethnicGroup] = `${contrabandDatum}/${searchDatum}`;
            }
          }
        }
        return yearData;
      });
    }
    return mergedData;
  }, [data]);

  return (
    <div>
      <Table data={mappedData} columns={columns} />
    </div>
  );
}

export default ContrabandHitrateTable;
