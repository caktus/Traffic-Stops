import React, { useState } from 'react';
import PropTypes from 'prop-types';
// import {
//   Suggestion,
//   SuggestionPart,
//   AutoSuggestionContainerStyled,
//   ContainerList,
// } from './AutoSuggest.styled';

import * as Styled from './AutoSuggest.styled';

// Deps
// import Autosuggest from 'react-autosuggest';
import { Select } from 'reaktus';
import AutosuggestHighlightMatch from 'autosuggest-highlight/match';
import AutosuggestHighlightParse from 'autosuggest-highlight/parse';

// Children
// import Input from './Input';

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
// function escapeRegexCharacters(str) {
//   return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }

// function getSuggestionValue(suggestion, accessor) {
//   return accessor ? suggestion[accessor] : suggestion;
// }

// function renderSuggestion(suggestion, query) {
//   const matches = AutosuggestHighlightMatch(value, query);
//   const parts = AutosuggestHighlightParse(value, matches);

//   return (
//     <Suggestion isHighlighted={isHighlighted}>
//       {parts.map((part, index) => {
//         return (
//           <SuggestionPart highlighted={part.highlight} key={index}>
//             {part.text}
//           </SuggestionPart>
//         );
//       })}
//     </Suggestion>
//   );
// }

// function AutoSuggestInput(inputProps) {
//   return <Input {...inputProps} />;
// }

// const AutoSuggestionContainer = ({ containerProps, children, dropdownSubComponent }) => {
//   const { className } = containerProps;
//   if (className.includes('--open')) {
//     return (
//       <AutoSuggestionContainerStyled {...containerProps}>
//         <ContainerList>{children}</ContainerList>
//         {dropdownSubComponent}
//       </AutoSuggestionContainerStyled>
//     );
//   } else return null;
// };

function AutoSuggest({
  data,
  onSelection,
  label,
  keyAccessor,
  labelAccessor,
  valueAccessor,
  renderBonusContent,
}) {
  // function getSuggestions(value, accessor) {
  //   const escapedValue = escapeRegexCharacters(value.trim());

  //   if (escapedValue === '') {
  //     return [];
  //   }

  //   const regex = new RegExp(escapedValue, 'i');

  //   return data.filter((item) => {
  //     const derivedItem = accessor ? item[accessor] : item;
  //     return regex.test(derivedItem);
  //   });
  // }

  // const onChange = (_, { newValue }) => setValue(newValue);

  // const onSuggestionsFetchRequested = ({ value }) => {
  //   if (!value) setSuggestions(data);
  //   else setSuggestions(getSuggestions(value, accessor));
  // };

  // const onSuggestionsClearRequested = () => setSuggestions([]);

  // const shouldRenderSuggestions = () => true;

  const filterOption = (value, option) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return option[labelAccessor].toLowerCase().slice(0, inputLength) === inputValue;
  };

  // const renderSuggestion = () => {};

  return (
    <Select
      onSelection={(s) => onSelection(s)}
      filterOption={filterOption}
      labelAccessor={labelAccessor}
      width="100%"
    >
      {label && (
        <Select.Label py={2} display="block">
          {label}
        </Select.Label>
      )}
      <Select.InputContainer>
        <Select.Input
          borderColor="grey"
          borderRadius="6px"
          borderColor="primary"
          fontSize="2"
          py="2"
          px="3"
          width="100%"
        />
      </Select.InputContainer>
      <Select.Dropdown boxShadow="depth5" border="none" borderColor="grey">
        <Select.OptionsList>
          {data.map((datum) => (
            <Select.Option key={datum[keyAccessor]} value={datum[valueAccessor]} option={datum}>
              <Styled.Option>{datum[labelAccessor]}</Styled.Option>
            </Select.Option>
          ))}
        </Select.OptionsList>
        {renderBonusContent && renderBonusContent()}
      </Select.Dropdown>
    </Select>
  );
  // return (
  //   <Autosuggest
  //     suggestions={suggestions}
  //     onSuggestionsFetchRequested={onSuggestionsFetchRequested}
  //     onSuggestionsClearRequested={onSuggestionsClearRequested}
  //     getSuggestionValue={(val) => getSuggestionValue(val, accessor)}
  //     shouldRenderSuggestions={shouldRenderSuggestions}
  //     onSuggestionSelected={onSuggestionSelected}
  //     renderSuggestion={renderSuggestion}
  //     renderInputComponent={AutoSuggestInput}
  //     renderSuggestionsContainer={(props) => (
  //       <AutoSuggestionContainer {...props} dropdownSubComponent={dropdownSubComponent} />
  //     )}
  //     inputProps={{
  //       ...inputProps,
  //       onChange,
  //       value,
  //     }}
  //   />
  // );
}

AutoSuggest.propTypes = {
  data: PropTypes.array.isRequired,
};
AutoSuggest.defaultProps = {
  data: [],
};

export default AutoSuggest;
