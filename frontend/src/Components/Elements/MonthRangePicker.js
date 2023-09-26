import Button from './Button';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';
import { ICONS } from '../../img/icons/Icon';
import React, { forwardRef, useEffect, useState } from 'react';

import { useTheme } from 'styled-components';
import DatePicker from 'react-datepicker';
import { getRangeValues } from '../../util/range';

const MonthPickerButton = forwardRef(({ value, onClick }, ref) => (
  <Button onClick={onClick} ref={ref}>
    {value}
  </Button>
));

export default function MonthRangePicker({
  deactivatePicker,
  onChange,
  onClosePicker,
  minY = null,
  maxY = null,
}) {
  const theme = useTheme();
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date().setFullYear(2001, 1, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [minDate, setMinDate] = useState(null);
  const [minYear, setMinYear] = useState(null);
  const [maxYear, setMaxYear] = useState(null);

  useEffect(() => {
    if (deactivatePicker) {
      setShowDateRangePicker(false);
    }
  }, [deactivatePicker]);

  useEffect(() => {
    setMinDate(minY);
    setStartDate(minY);
    setEndDate(maxY);
    setMinYear(minY);
    setMaxYear(maxY);
  }, [minY, maxY]);

  const showDatePicker = () => {
    if (!minYear && !maxYear) {
      const rangeValues = getRangeValues();
      setStartDate(new Date().setFullYear(rangeValues.from.year, 1));
    }
    setShowDateRangePicker(true);
  };

  const closeRangePicker = async () => {
    setShowDateRangePicker(false);

    if (minYear && maxY) {
      setMinDate(minY);
      setStartDate(minY);
      setEndDate(maxY);
    } else {
      const rangeValues = getRangeValues(true);
      setStartDate(new Date().setFullYear(rangeValues.from.year, 1));
      setEndDate(new Date());
      setMinDate(null);
    }

    onChange(null);
    onClosePicker();
  };

  const onDateRangeChange = async (dates) => {
    // eslint-disable-next-line prefer-const
    let [start, end] = dates;

    setStartDate(start);
    if (!minDate) {
      const _minDate = new Date(start);
      setMinDate(new Date(_minDate.setMonth(_minDate.getMonth() + 4)));
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
      onChange(rangeVal);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {!showDateRangePicker && (
        <Button variant="positive" marginTop={10} onClick={showDatePicker}>
          Filter by date range
        </Button>
      )}
      {showDateRangePicker && (
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: '10' }}>
          <div style={{ width: '200px' }}>
            <DatePicker
              selected={endDate}
              onChange={onDateRangeChange}
              startDate={startDate}
              endDate={endDate}
              minDate={minYear}
              maxDate={maxYear}
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
