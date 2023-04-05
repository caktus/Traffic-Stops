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
const pickerLang = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  from: 'From',
  to: 'To',
};

export default function MonthRangePicker({ agencyId, dataSet, onChange, onClosePicker }) {
  const theme = useTheme();
  const [rangeValue, setRangeValue] = useState(getRangeValues);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const monthPickerRef = useRef(null);

  const makeText = (m) => {
    if (m && m.year && m.month) return pickerLang.months[m.month - 1] + '. ' + m.year;
    return '?';
  };

  const closeRangePicker = async () => {
    setShowDateRangePicker(false);
    setRangeValue(getRangeValues);
    await updateDatePicker(getRangeValues());
    onClosePicker();
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
    const diffYears = toDate.getFullYear() - fromDate.getFullYear();

    let xAxis = 'Year';
    const yearRange = range(rangeVal.from.year, rangeVal.to.year + 1, 1);
    if (diffYears < 3) {
      xAxis = 'Month';
      if (diffYears === 0 && toDate.getMonth() - fromDate.getMonth() < 4) {
        xAxis = 'Week';
      }
    }
    try {
      const { data } = await axios.get(url);
      if (xAxis === 'Month' || xAxis === 'Week') {
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      onChange({ data, xAxis, yearRange });
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
