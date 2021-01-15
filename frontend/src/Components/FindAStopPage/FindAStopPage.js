import React, { useState } from 'react';
import * as S from './FindAStopPage.styled';

// Constants
import * as chartFields from './stopSearchFields';

// Children
import { ResponsiveInnerPage } from 'styles/StyledComponents/FullWidthPage.styled';
import { HelpText } from 'Components/Elements/Inputs/Input.styled';
import Input from 'Components/Elements/Inputs/Input';
import DatePicker from 'Components/Elements/Inputs/DatePicker';
import DepartmentSearch from 'Components/Elements/DepartmentSearch';
import Button from 'Components/Elements/Button';
import Checkbox from 'Components/Elements/Inputs/Checkbox';

function FindAStopPage() {
  const [errors, setErrors] = useState({});
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [age, setAge] = useState('');

  const [listFields, setListFields] = useState({
    genders: [],
    races: [],
    ethnicities: [],
    purposes: [],
    actions: [],
  });

  const [officerId, setOfficerId] = useState('');

  const setListValue = (type, value) => {
    let newListValues;
    if (listFields[type].includes(value)) {
      // remove it from listFields[type]
      newListValues = listFields[type].filter((v) => v !== value);
    } else {
      newListValues = [...listFields[type], value];
    }
    setListFields({
      ...listFields,
      [type]: newListValues,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!department) {
      setErrors({ department: ['This field is required'] });
    } else {
      // post to some endpoint or another
      const searchFormData = new FormData();
      if (department) searchFormData.append('department', department.id);
      if (startDate) searchFormData.append('startDate', startDate);
      if (endDate) searchFormData.append('endDate', endDate);
      if (age) searchFormData.append('age', age);
      if (officerId) searchFormData.append('officerId', officerId);
      for (const field in listFields) {
        if (Object.hasOwnProperty.call(listFields, field)) {
          const entries = listFields[field];
          if (entries.length > 0) searchFormData.append(field, JSON.stringify(entries));
        }
      }

      setErrors({});

      for (const pair of searchFormData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
    }
  };

  return (
    <S.Page>
      <ResponsiveInnerPage>
        <h1>FIND A STOP</h1>
        <S.Form>
          <S.FieldSet>
            <S.Legend>1. Choose the police or sheriff's department</S.Legend>
            <S.FormGroup>
              <S.SearchInputWrapper>
                <DepartmentSearch
                  onChange={(value) => setDepartment(value)}
                  label="Department"
                  required
                  errors={errors.department}
                />
                <HelpText>ex: Durham Police Department</HelpText>
              </S.SearchInputWrapper>
              <S.InputWrapper>
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
                  errors={errors.startDate}
                />
              </S.InputWrapper>
              <S.InputWrapper>
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
                  errors={errors.endDate}
                />
              </S.InputWrapper>
            </S.FormGroup>
          </S.FieldSet>
          <S.FieldSet>
            <S.Legend>
              2. Include driver information to narrow results
              <S.LegendSpan> (optional)</S.LegendSpan>
            </S.Legend>
            <S.FormGroup>
              <S.InputColumn>
                <div style={{ width: 156 }}>
                  <Input label="Age" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
              </S.InputColumn>
              <S.InputColumn>
                <S.Label>Gender</S.Label>
                {chartFields.GENDER.map((d) => (
                  <Checkbox
                    label={d[1]}
                    value={d[0]}
                    key={d[0]}
                    checked={listFields.genders.includes(d[0])}
                    onChange={(value) => setListValue('genders', value)}
                    errors={errors[d[0]]}
                  />
                ))}
              </S.InputColumn>
              <S.InputColumn>
                <S.Label>Race</S.Label>
                {chartFields.RACE.map((d) => (
                  <Checkbox
                    label={d[1]}
                    value={d[0]}
                    key={d[0]}
                    checked={listFields.races.includes(d[0])}
                    onChange={(value) => setListValue('races', value)}
                    errors={errors[d[0]]}
                  />
                ))}
              </S.InputColumn>
              <S.InputColumn>
                <S.Label>Ethnicity</S.Label>
                {chartFields.ETHNICITY.map((d) => (
                  <Checkbox
                    label={d[1]}
                    value={d[0]}
                    key={d[0]}
                    checked={listFields.ethnicities.includes(d[0])}
                    onChange={(value) => setListValue('ethnicities', value)}
                    errors={errors[d[0]]}
                  />
                ))}
              </S.InputColumn>
            </S.FormGroup>
          </S.FieldSet>
          <S.FieldSet>
            <S.Legend>
              3. Use Officer ID or stop information to narrow results
              <S.LegendSpan> (optional)</S.LegendSpan>
            </S.Legend>
            <S.FormGroup>
              <S.InputColumn>
                <div style={{ width: 208 }}>
                  <Input
                    label="CopWatch Officer ID"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    errors={errors.officerId}
                  />
                </div>
                <S.Note>
                  NOTE: This is NOT the officer’s badge number - to find this number, search on
                  other parameters to find the stop and select the Officer ID from there.
                </S.Note>
              </S.InputColumn>
              <S.InputColumn>
                <S.Label>Purpose of Stop</S.Label>
                {chartFields.PURPOSE_OF_STOP.map((d) => (
                  <Checkbox
                    label={d[1]}
                    value={d[0]}
                    key={d[0]}
                    checked={listFields.purposes.includes(d[0])}
                    onChange={(value) => setListValue('purposes', value)}
                    errors={errors[d[0]]}
                  />
                ))}
              </S.InputColumn>
              <S.InputColumn>
                <S.Label>Action Taken</S.Label>
                {chartFields.ACTION_TAKEN.map((d) => (
                  <Checkbox
                    label={d[1]}
                    value={d[0]}
                    key={d[0]}
                    checked={listFields.actions.includes(d[0])}
                    onChange={(value) => setListValue('actions', value)}
                    errors={errors[d[0]]}
                  />
                ))}
              </S.InputColumn>
            </S.FormGroup>
          </S.FieldSet>
          <Button
            onClick={handleSearch}
            variant="positive"
            width="100%"
            py="2"
            fontSize="3"
            fontWeight="bold"
          >
            SEARCH
          </Button>
        </S.Form>
      </ResponsiveInnerPage>
    </S.Page>
  );
}

export default FindAStopPage;
