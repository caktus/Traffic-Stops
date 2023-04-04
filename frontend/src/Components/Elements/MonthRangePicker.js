import Button from './Button';
import Picker from 'react-month-picker';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';
import { ICONS } from '../../img/icons/Icon';
import React, { useRef, useState } from 'react';
import 'react-month-picker/css/month-picker.css';
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

function MonthBox({ value, _onClick }) {
  return (
    <div className="box" onClick={_onClick}>
      <Button onClick={() => {}}>{value}</Button>
    </div>
  );
}

function getRangeValues() {
  const today = new Date();

  return {
    from: {
      year: 2000,
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

function diffYears(dt2, dt1) {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60 * 60 * 24;
  return Math.abs(Math.round(diff / 365.25));
}

const pickerLang = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  from: 'From',
  to: 'To',
};

function dateRange(startDate, endDate) {
  const start = startDate.split('-');
  const end = endDate.split('-');
  const startYear = parseInt(start[0], 10);
  const endYear = parseInt(end[0], 10);
  const dates = [];

  for (let i = startYear; i <= endYear; i++) {
    const endMonth = i !== endYear ? 11 : parseInt(end[1], 10) - 1;
    const startMon = i === startYear ? parseInt(start[1], 10) - 1 : 0;
    for (let j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j + 1) {
      const month = j + 1;
      const displayMonth = month < 10 ? '0' + month : month;
      dates.push([i, displayMonth, '01'].join('-'));
    }
  }
  return dates;
}

export default function MonthRangePicker({ agencyId, dataSet, onChange }) {
  const theme = useTheme();
  const [rangeValue, setRangeValue] = useState(getRangeValues);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const monthPickerRef = useRef(null);

  const makeText = (m) => {
    if (m && m.year && m.month) return pickerLang.months[m.month - 1] + '. ' + m.year;
    return '?';
  };

  const closeRangePicker = () => {
    setShowDateRangePicker(false);
    setRangeValue(getRangeValues);
  };

  const updateDatePicker = async (rangeVal) => {
    setRangeValue(rangeVal);
    let tableDS = mapDataSetToEnum[dataSet];
    if (Array.isArray(dataSet)) {
      tableDS = mapDataSetToEnum[dataSet[1]];
    }
    const getEndpoint = mapDatasetKeyToEndpoint(tableDS);
    const _from = `${rangeVal.from.year}-${rangeVal.from.month}-01`;
    const _to = `${rangeVal.to.year}-${rangeVal.to.month}-01`;
    const url = `${getEndpoint(agencyId)}?from=${_from}&to=${_to}`;
    const fromDate = new Date(_from);
    const toDate = new Date(_to);
    let xAxis = 'year';
    let monthsRange = null;
    const yearRange = range(rangeVal.from.year, rangeVal.to.year + 1, 1);
    if (diffYears(fromDate, toDate) <= 2) {
      xAxis = 'month';
      monthsRange = dateRange(_from, _to);
    }
    try {
      const { data } = await axios.get(url);
      onChange({ data, xAxis, monthsRange, yearRange });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      {!showDateRangePicker && (
        <Button variant="positive" marginTop={10} onClick={() => setShowDateRangePicker(true)}>
          Filter by date range
        </Button>
      )}
      {showDateRangePicker && (
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: '10' }}>
          <Picker
            className="MonthYearPicker"
            lang={pickerLang.months}
            ref={monthPickerRef}
            years={{ min: 2000 }}
            value={rangeValue}
            theme="light"
            onDismiss={(value) => updateDatePicker(value)}
          >
            <MonthBox
              value={makeText(rangeValue.from) + ' ~ ' + makeText(rangeValue.to)}
              _onClick={() => monthPickerRef.current.show()}
            />
          </Picker>
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
