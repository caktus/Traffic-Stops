import React from 'react';
import decimalToFixedPercent from 'util/decimalToFixedPercent';

// Components
import Table from 'Components/Elements/Table/Table';

function CensusDataTable({ data }) {
  const columns = React.useMemo(
    () => [
      {
        Header: '',
        accessor: 'type', // accessor is the "key" in the data
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

  const _formatPercent = (percent) => {
    return `${percent}%`;
  };

  const mappedData = React.useMemo(() => {
    let mapped = [];
    if (data) {
      const total = data.total;
      const percentage = {
        type: 'Percentage',
      };
      const population = {
        type: 'Population',
        ...data,
      };
      mapped.push(population);

      for (const group in data) {
        if (group === 'total') continue;
        if (data.hasOwnProperty(group)) {
          const groupCount = data[group];
          percentage[group] = _formatPercent(decimalToFixedPercent(groupCount, total));
        }
      }
      mapped.push(percentage);
    }
    return mapped;
  }, [data]);

  return (
    <div>
      <Table data={mappedData} columns={columns} />
    </div>
  );
}

export default CensusDataTable;
