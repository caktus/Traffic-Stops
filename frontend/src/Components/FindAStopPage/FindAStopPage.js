import React, { useState } from 'react';
import * as Styled from './FindAStopPage.styled';

// Children
import Input, { iconPositions } from 'Components/Elements/Inputs/Input';
import DatePicker from 'Components/Elements/Inputs/DatePicker';
import DepartmentSearch from 'Components/Elements/DepartmentSearch';
import Button from 'Components/Elements/Button';

function FindAStopPage() {
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  return (
    <Styled.Page>
      <h1>FIND A STOP</h1>
      <Styled.Form>
        <Styled.FieldSet>
          <Styled.Legend>1. Choose the police or sheriff's department</Styled.Legend>
          <Styled.FormGroup>
            <Styled.SearchInputWrapper>
              <DepartmentSearch
                onChange={(value) => setDepartment(value)}
                label="Department"
                required
                helpText="ex: Durham Police Department"
              />
            </Styled.SearchInputWrapper>
            <Styled.InputWrapper>
              <DatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={new Date()}
                inputProps={{
                  label: 'Start Date',
                  optional: true,
                }}
              />
            </Styled.InputWrapper>
            <Styled.InputWrapper>
              <DatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                maxDate={new Date()}
                inputProps={{
                  label: 'End Date',
                  optional: true,
                }}
              />
            </Styled.InputWrapper>
          </Styled.FormGroup>
        </Styled.FieldSet>
        <Styled.FieldSet>
          <Styled.Legend>
            2. Include driver information to narrow results
            <Styled.LegendSpan> (optional)</Styled.LegendSpan>
          </Styled.Legend>
        </Styled.FieldSet>
        <Styled.FieldSet>
          <Styled.Legend>
            3. Use Officer ID or stop information to narrow results
            <Styled.LegendSpan> (optional)</Styled.LegendSpan>
          </Styled.Legend>
        </Styled.FieldSet>
        <Button variant="positive" width="100%" py="2" fontSize="3">
          Search
        </Button>
      </Styled.Form>
    </Styled.Page>
  );
}

export default FindAStopPage;
