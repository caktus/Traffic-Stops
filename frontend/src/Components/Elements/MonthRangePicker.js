import Button from './Button';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';
import { ICONS } from '../../img/icons/Icon';
import React, { forwardRef, useState } from 'react';
import mapDatasetKeyToEndpoint from '../../Services/endpoints';
import axios from '../../Services/Axios';
import {
  CONTRABAND_HIT_RATE,
  LIKELIHOOD_OF_SEARCH,
  SEARCHES,
  SEARCHES_BY_TYPE,
  STOPS,
  STOPS_BY_REASON,
  USE_OF_FORCE,
} from '../../Hooks/useDataset';
import { useTheme } from 'styled-components';
import range from 'lodash.range';
import DatePicker from 'react-datepicker';

function getRangeValues() {
  const today = new Date();

  return {
    from: {
      year: 2001,
      month: 1,
    },
    to: {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    },
  };
}
const mapDataSetToEnum = {
  STOPS,
  SEARCHES,
  STOPS_BY_REASON,
  SEARCHES_BY_TYPE,
  USE_OF_FORCE,
  CONTRABAND_HIT_RATE,
  LIKELIHOOD_OF_SEARCH,
};

const MonthPickerButton = forwardRef(({ value, onClick }, ref) => (
  <Button onClick={onClick} ref={ref}>
    {value}
  </Button>
));

export default function MonthRangePicker({ agencyId, dataSet, onChange, onClosePicker }) {
  const theme = useTheme();
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [minDate, setMinDate] = useState(null);

  const closeRangePicker = async () => {
    setShowDateRangePicker(false);
    setMinDate(null);
    await updateDatePicker(getRangeValues());
    onClosePicker();
  };

  const updateDatePicker = async (rangeVal) => {
    let tableDS = mapDataSetToEnum[dataSet];
    if (Array.isArray(dataSet)) {
      tableDS = mapDataSetToEnum[dataSet[1]];
    }
    const getEndpoint = mapDatasetKeyToEndpoint(tableDS);
    const _from = `${rangeVal.from.year}-${rangeVal.from.month.toString().padStart(2, 0)}-01`;
    const _to = `${rangeVal.to.year}-${rangeVal.to.month.toString().padStart(2, 0)}-01`;
    const url = `${getEndpoint(agencyId)}?from=${_from}&to=${_to}`;

    const fromDate = new Date(_from);
    fromDate.setDate(fromDate.getDate() + 1); // To prevent getting last month's date in new year
    fromDate.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const toDate = new Date(_to);
    toDate.setDate(toDate.getDate() + 1); // To prevent getting last month's date in new year
    toDate.toLocaleString('en-US', { timeZone: 'America/New_York' });

    const diffYears = toDate.getFullYear() - fromDate.getFullYear();
    let xAxis = 'Year';
    const yearRange = range(rangeVal.from.year, rangeVal.to.year + 1, 1);
    if (diffYears < 3) {
      xAxis = 'Month';
    }
    try {
      const { data } = await axios.get(url);
      if (xAxis === 'Month') {
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      onChange({ data, xAxis, yearRange });
    } catch (err) {
      console.log(err);
    }
  };

  const onDateRangeChange = async (dates) => {
    let [start, end] = dates;

    setStartDate(start);
    if (!minDate) {
      const minDate = new Date(start);
      setMinDate(new Date(minDate.setMonth(minDate.getMonth() + 4)));
    }

    // Don't allow same month/year selected
    if (end && start.getDay() === end.getDay()) {
      end = new Date(end.setMonth(end.getMonth() + 1));
    } else {
      setEndDate(end);
    }

    if (start && end) {
      // Update range value on when valid start/end dates are selected
      const rangeVal = {
        from: { month: start.getMonth() + 1, year: start.getFullYear() },
        to: { month: end.getMonth() + 1, year: end.getFullYear() },
      };
      await updateDatePicker(rangeVal);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {!showDateRangePicker && (
        <Button variant="positive" marginTop={10} onClick={() => setShowDateRangePicker(true)}>
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
              minDate={minDate}
              maxDate={new Date()}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              selectsRange
              customInput={<MonthPickerButton />}
              popperPlacement="bottom-end"
              monthClassName={() => 'fj-date-range-month'}
              onCalendarOpen={() => setMinDate(null)}
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
    </div>
  );
}
