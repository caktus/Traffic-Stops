import Button from './Button';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';
import { ICONS } from '../../img/icons/Icon';
import React, { forwardRef, useEffect, useState } from 'react';
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
import { getRangeValues } from '../../util/range';

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

export default function MonthRangePicker({
  agencyId,
  dataSet,
  deactivatePicker,
  forcePickerRerender,
  onChange,
  onClosePicker,
}) {
  const theme = useTheme();
  const startYear = new Date().setFullYear(2000, 1, 1);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [startDate, setStartDate] = useState(startYear);
  const [endDate, setEndDate] = useState(new Date());
  const [minDate, setMinDate] = useState(null);

  useEffect(() => {
    if (deactivatePicker) {
      setShowDateRangePicker(false);
      setMinDate(null);
      setStartDate(startYear);
      setEndDate(new Date());
    }
  }, [deactivatePicker]);

  useEffect(() => {
    const rerenderData = async () => {
      const rangeVal = {
        from: { month: startDate.getMonth() + 1, year: startDate.getFullYear() },
        to: { month: endDate.getMonth() + 1, year: endDate.getFullYear() },
      };
      await updateDatePicker(rangeVal);
    };
    if (forcePickerRerender) {
      rerenderData().catch((err) => console.log(err));
    }
  }, [forcePickerRerender]);

  const showDatePicker = () => {
    const rangeValues = getRangeValues();
    setStartDate(new Date().setFullYear(rangeValues.from.year, 1));
    setShowDateRangePicker(true);
  };

  const closeRangePicker = async () => {
    setShowDateRangePicker(false);

    const rangeValues = getRangeValues(true);
    setStartDate(new Date().setFullYear(rangeValues.from.year, 1));
    setEndDate(new Date());
    setMinDate(null);

    await updateDatePicker(rangeValues);
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
      onChange({ data, xAxis, yearRange });
    } catch (err) {
      console.log(err);
    }
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
      await updateDatePicker(rangeVal);
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
