import React, { useState } from 'react';
import * as S from './FindAStopPage.styled';

// Constants
import * as chartFields from './stopSearchFields';

// Router
import { useHistory } from 'react-router-dom';

// Util
import formatDate from '../../util/formatDate';

// Children
import { HelpText } from '../Elements/Inputs/Input.styled';
import Input from '../Elements/Inputs/Input';
import DatePicker from '../Elements/Inputs/DatePicker';
import DepartmentSearch from '../Elements/DepartmentSearch';
import Button from '../Elements/Button';
import Checkbox from '../Elements/Inputs/Checkbox';
import { H1 } from '../../styles/StyledComponents/Typography';

function FindAStopPage() {
  const history = useHistory();

  const [errors, setErrors] = useState({});

  const [formFields, setFormFields] = useState({
    agency: '',
    stop_date_after: null,
    stop_date_before: null,
    age: '',
    stop_officer_id: '',
  });

  const [listFields, setListFields] = useState({
    gender: [],
    race: [],
    ethnicity: [],
    stop_purpose: [],
    stop_action: [],
  });

  const setFormValue = (type, value) => {
    setFormFields({
      ...formFields,
      [type]: value,
    });
  };

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

  const _buildQueryString = () => {
    let qs = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const field in formFields) {
      if (Object.hasOwnProperty.call(formFields, field)) {
        let value = formFields[field];
        if (field === 'stop_date_after' || field === 'stop_date_before') {
          value = formFields[field] ? formatDate(formFields[field]) : '';
        }
        if (field === 'agency') {
          value = formFields[field].id;
        }
        qs += `&${field}=${value}`;
      }
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const field in listFields) {
      if (Object.hasOwnProperty.call(listFields, field)) {
        const values = listFields[field];
        // eslint-disable-next-line no-loop-func
        values.forEach((v) => {
          qs += `&${field}=${v}`;
        });
      }
    }
    return qs;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!formFields.agency) {
      setErrors({ agency: ['This field is required'] });
    } else {
      // Search just appends the query params to the current url
      // Routing renders a new component when it detects params
      // This way, users can navigate directly to /stops?[query params] and get the results
      history.push({
        pathname: '',
        search: _buildQueryString(),
      });
    }
  };

  return (
    <S.Page>
      <H1>FIND A STOP</H1>
      <S.Form>
        <S.FieldSet>
          <S.Legend>1. Choose the police or sheriffs department</S.Legend>
          <S.FormGroup>
            <S.SearchInputWrapper>
              <DepartmentSearch
                onChange={(value) => setFormValue('agency', value)}
                label="Department"
                required
                errors={errors.agency}
              />
              <HelpText>ex: Durham Police Department</HelpText>
            </S.SearchInputWrapper>
            <S.InputWrapper>
              <DatePicker
                value={formFields.stop_date_after}
                onChange={(date) => setFormValue('stop_date_after', date)}
                selectsStart
                startDate={formFields.stop_date_after}
                endDate={formFields.stop_date_before}
                maxDate={new Date()}
                inputProps={{
                  label: 'Start Date',
                  optional: true,
                }}
                errors={errors.stop_date_after}
              />
            </S.InputWrapper>
            <S.InputWrapper>
              <DatePicker
                value={formFields.stop_date_before}
                onChange={(date) => setFormValue('stop_date_before', date)}
                selectsEnd
                startDate={formFields.stop_date_after}
                endDate={formFields.stop_date_before}
                minDate={formFields.stop_date_after}
                maxDate={new Date()}
                inputProps={{
                  label: 'End Date',
                  optional: true,
                }}
                errors={errors.stop_date_before}
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
                <Input
                  label="Age"
                  value={formFields.age}
                  onChange={(e) => setFormValue('age', e.target.value)}
                />
              </div>
            </S.InputColumn>
            <S.InputColumn>
              <S.Label>Gender</S.Label>
              {chartFields.GENDER.map((d) => (
                <Checkbox
                  label={d[1]}
                  value={d[0]}
                  key={d[0]}
                  checked={listFields.gender.includes(d[0])}
                  onChange={(value) => setListValue('gender', value)}
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
                  checked={listFields.race.includes(d[0])}
                  onChange={(value) => setListValue('race', value)}
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
                  checked={listFields.ethnicity.includes(d[0])}
                  onChange={(value) => setListValue('ethnicity', value)}
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
                  value={formFields.stop_officer_id}
                  onChange={(e) => setFormValue('stop_officer_id', e.target.value)}
                  errors={errors.stop_officer_id}
                />
              </div>
              <S.Note>
                NOTE: This is NOT the officer’s badge number - to find this number, search on other
                parameters to find the stop and select the Officer ID from there.
              </S.Note>
            </S.InputColumn>
            <S.InputColumn>
              <S.Label>Purpose of Stop</S.Label>
              {chartFields.PURPOSE_OF_STOP.map((d) => (
                <Checkbox
                  label={d[1]}
                  value={d[0]}
                  key={d[0]}
                  checked={listFields.stop_purpose.includes(d[0])}
                  onChange={(value) => setListValue('stop_purpose', value)}
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
                  checked={listFields.stop_action.includes(d[0])}
                  onChange={(value) => setListValue('stop_action', value)}
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
    </S.Page>
  );
}

export default FindAStopPage;
