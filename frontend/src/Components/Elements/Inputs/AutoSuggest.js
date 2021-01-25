import React from 'react';
import PropTypes from 'prop-types';
import * as Styled from './AutoSuggest.styled';

import { Select } from 'reaktus';

import { HelpText } from 'Components/Elements/Inputs/Input.styled';
// import AutosuggestHighlightMatch from 'autosuggest-highlight/match';
// import AutosuggestHighlightParse from 'autosuggest-highlight/parse';

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

function AutoSuggest({
  data,
  onSelection,
  label,
  keyAccessor,
  labelAccessor,
  valueAccessor,
  renderBonusContent,
  onDropdownChange,
  renderInput,
  helpText,
  ...props
}) {
  const selectRef = React.useRef();

  const filterOption = (value, option) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return option[labelAccessor].toLowerCase().slice(0, inputLength) === inputValue;
  };

  return (
    <>
      <Select
        ref={selectRef}
        onSelection={(s) => onSelection(s)}
        onDropdownChange={onDropdownChange}
        filterOption={filterOption}
        labelAccessor={labelAccessor}
        width="100%"
        {...props}
      >
        {label && (
          <Select.Label py={2} display="block">
            {label}
          </Select.Label>
        )}
        <Select.InputContainer>
          <Select.Input renderInput={renderInput} />
        </Select.InputContainer>
        <Select.Dropdown boxShadow="depth5" border="none" borderColor="grey">
          <Select.OptionsList>
            {data.map((datum) => (
              <Select.Option key={datum[keyAccessor]} value={datum[valueAccessor]} option={datum}>
                <Styled.Option>{datum[labelAccessor]}</Styled.Option>
              </Select.Option>
            ))}
          </Select.OptionsList>
          {renderBonusContent && renderBonusContent({ selectRef })}
        </Select.Dropdown>
      </Select>

      {helpText && <HelpText>{helpText}</HelpText>}
    </>
  );
}

AutoSuggest.propTypes = {
  data: PropTypes.array.isRequired,
};
AutoSuggest.defaultProps = {
  data: [],
};

export default AutoSuggest;
