import React, { useMemo, useState } from 'react';
import { useTheme } from 'styled-components';

import Button from '../Elements/Button';
import { ICONS } from '../../img/icons/Icon';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';
import DisparityTableModal from './DisparityTableModal';
import * as S from './AgencyDisparities.styled';

// "View data" button + modal shown under a chart or map. `columns` is an array
// of { key, label, numeric, format, link } describing each column; `rows` are
// the same records the visual already fetched via useDisparityData. The modal
// reuses the shared paginated table + CSV download used across the rest of the
// site.
export default function DisparityTable({ rows, columns, title, downloadName }) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Adapt the lightweight column configs to the shared react-table format,
  // rendering formatted values and agency links inside each cell.
  const tableColumns = useMemo(
    () =>
      columns.map((col) => ({
        Header: col.label,
        accessor: col.key,
        // eslint-disable-next-line react/no-unstable-nested-components
        Cell: ({ value, row }) => {
          const content = col.format ? col.format(value, row.original) : value;
          if (col.link) return <S.TableLink to={col.link(row.original)}>{content}</S.TableLink>;
          return content;
        },
      })),
    [columns]
  );

  // Flatten each row into formatted, label-keyed values for the CSV export.
  const csvData = useMemo(
    () =>
      rows.map((row) => {
        const record = {};
        columns.forEach((col) => {
          const raw = row[col.key];
          record[col.label] = col.format ? col.format(raw, row) : raw;
        });
        return record;
      }),
    [rows, columns]
  );

  if (!rows || !rows.length) return null;

  return (
    <>
      <S.TableButtonRow>
        <Button
          variant="neutral"
          border={`2px solid ${theme.colors.primary}`}
          {...ChartHeaderStyles.ButtonInlines}
          onClick={() => setIsOpen(true)}
        >
          <ChartHeaderStyles.Icon
            icon={ICONS.view}
            height={25}
            width={25}
            fill={theme.colors.primary}
          />
          View Data
        </Button>
      </S.TableButtonRow>

      <DisparityTableModal
        tableHeader={title || 'Data table'}
        tableData={rows}
        csvData={csvData}
        columns={tableColumns}
        tableDownloadName={`${downloadName || 'disparities'}.csv`}
        isOpen={isOpen}
        closeModal={() => setIsOpen(false)}
      />
    </>
  );
}
