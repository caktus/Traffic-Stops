import React, { useState } from 'react';
import { useChartState } from 'Context/chart-state';
import TableModal from 'Components/Elements/Table/TableModal';

function useTableModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dataSet, setDataSet] = useState();
  const [columns, setColumns] = useState();

  const [chartState] = useChartState();

  const _renderTableModal = () => {
    return (
      <TableModal
        chartState={chartState}
        dataSet={dataSet}
        columns={columns}
        isOpen={isOpen}
        closeModal={() => setIsOpen(false)}
      />
    );
  };

  const openModal = (d, c) => {
    if (!d || !c || c.length === 0) {
      throw new Error(
        'openModal function requires data-set accessor and columns to be passed as arguments'
      );
    }
    setDataSet(d);
    setColumns(c);
    setIsOpen(true);
  };

  return [_renderTableModal, { openModal }];
}

export default useTableModal;
