import React from 'react';

// Components
import Table from 'Components/Elements/Table/Table';

function DepartmentalStopCountTable({ data }) {
  console.log('Table render!!');
  const columns = React.useMemo(
    () => [
      {
        Header: 'Year',
        accessor: 'year', // accessor is the "key" in the data
      },
      {
        Header: 'Stop-reason',
        accessor: 'purpose', // accessor is the "key" in the data
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

  return (
    <div>
      <Table data={data} columns={columns} />
    </div>
  );
}

export default DepartmentalStopCountTable;
