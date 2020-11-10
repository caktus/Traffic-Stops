import React from 'react';
import * as Styled from './FindAStopPage.styled';

// Children
import Input, { iconPositions, icons } from 'Components/Elements/Inputs/Input';

function FindAStopPage(props) {
  return (
    <Styled.Page>
      <h1>FIND A STOP</h1>
      <Styled.Form>
        <Styled.FieldSet>
          <Styled.Legend>1. Choose the police or sheriff's department</Styled.Legend>
          <Styled.FormGroup>
            <Styled.SearchInputWrapper>
              <Input
                label="Department"
                required
                iconPosition={iconPositions.LEFT}
                Icon={icons.search}
                helpText="ex: Durham Police Department"
              />
            </Styled.SearchInputWrapper>
            <Styled.InputWrapper>
              <Input
                label="Start Date"
                optional
                iconPosition={iconPositions.RIGHT}
                Icon={icons.calendar}
              />
            </Styled.InputWrapper>
            <Styled.InputWrapper>
              <Input
                label="End Date"
                optional
                iconPosition={iconPositions.RIGHT}
                Icon={icons.calendar}
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
      </Styled.Form>
    </Styled.Page>
  );
}

export default FindAStopPage;
