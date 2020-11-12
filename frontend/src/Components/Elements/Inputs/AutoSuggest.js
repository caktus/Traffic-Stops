import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Suggestion,
  SuggestionPart,
  AutoSuggestionContainerStyled,
  ContainerList,
} from './AutoSuggest.styled';

// Deps
import Autosuggest from 'react-autosuggest';
import AutosuggestHighlightMatch from 'autosuggest-highlight/match';
import AutosuggestHighlightParse from 'autosuggest-highlight/parse';

// Children
import Input from './Input';

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSuggestionValue(suggestion, accessor) {
  return accessor ? suggestion[accessor] : suggestion;
}

function renderSuggestion(suggestion, { query, isHighlighted }) {
  const matches = AutosuggestHighlightMatch(suggestion.name, query);
  const parts = AutosuggestHighlightParse(suggestion.name, matches);

  return (
    <Suggestion isHighlighted={isHighlighted}>
      {parts.map((part, index) => {
        return (
          <SuggestionPart highlighted={part.highlight} key={index}>
            {part.text}
          </SuggestionPart>
        );
      })}
    </Suggestion>
  );
}

function AutoSuggestInput(inputProps) {
  return <Input {...inputProps} />;
}

const AutoSuggestionContainer = ({ containerProps, children, dropdownSubComponent }) => {
  const { className } = containerProps;
  if (className.includes('--open')) {
    return (
      <AutoSuggestionContainerStyled {...containerProps}>
        <ContainerList>{children}</ContainerList>
        {dropdownSubComponent}
      </AutoSuggestionContainerStyled>
    );
  } else return null;
};

function AutoSuggest({ data, accessor, onSuggestionSelected, dropdownSubComponent, inputProps }) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  function getSuggestions(value, accessor) {
    const escapedValue = escapeRegexCharacters(value.trim());

    if (escapedValue === '') {
      return [];
    }

    const regex = new RegExp(escapedValue, 'i');

    return data.filter((item) => {
      const derivedItem = accessor ? item[accessor] : item;
      return regex.test(derivedItem);
    });
  }

  const onChange = (_, { newValue }) => setValue(newValue);

  const onSuggestionsFetchRequested = ({ value }) => {
    if (!value) setSuggestions(data);
    else setSuggestions(getSuggestions(value, accessor));
  };

  const onSuggestionsClearRequested = () => setSuggestions([]);

  const shouldRenderSuggestions = () => true;

  return (
    <Autosuggest
      suggestions={suggestions}
      onSuggestionsFetchRequested={onSuggestionsFetchRequested}
      onSuggestionsClearRequested={onSuggestionsClearRequested}
      getSuggestionValue={(val) => getSuggestionValue(val, accessor)}
      shouldRenderSuggestions={shouldRenderSuggestions}
      onSuggestionSelected={onSuggestionSelected}
      renderSuggestion={renderSuggestion}
      renderInputComponent={AutoSuggestInput}
      renderSuggestionsContainer={(props) => (
        <AutoSuggestionContainer {...props} dropdownSubComponent={dropdownSubComponent} />
      )}
      inputProps={{
        ...inputProps,
        onChange,
        value,
      }}
    />
  );
}

AutoSuggest.propTypes = {
  data: PropTypes.array.isRequired,
};
AutoSuggest.defaultProps = {
  data: [],
};

export default AutoSuggest;
