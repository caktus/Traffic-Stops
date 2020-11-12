import React from 'react';
import Datepicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Children
import Input, { icons, iconPositions } from 'Components/Elements/Inputs/Input';

function DatePicker({ value, onChange, inputProps, ...props }) {
  return (
    <Datepicker
      customInput={
        <Input {...inputProps} Icon={icons.calendar} iconPosition={iconPositions.RIGHT} />
      }
      selected={value}
      onChange={onChange}
      {...props}
      popperModifiers={{
        preventOverflow: {
          enabled: true,
          escapeWithReference: false,
          boundariesElement: 'scrollParent',
        },
      }}
    />
  );
}

export default DatePicker;
