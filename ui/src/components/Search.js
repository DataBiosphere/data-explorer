import React from "react";
import "@clr/icons";
import "@clr/icons/clr-icons.css";
import AsyncSelect from "react-select/lib/Async";
import { components } from "react-select";

import DownAngleIcon from "libs/icons";

// To get readable class names, add classNamePrefix="foo" to <AsyncSelect>
const styles = {
  clearIndicator: (provided, state) => ({
    ...provided,
    color: "#5c912e"
  }),
  container: (provided, state) => ({
    ...provided,
    fontFamily: ["Montserrat", "sans-serif"].join(","),
    fontSize: 13
  }),
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#ebedef",
    border: 0,
    height: 45,
    margin: "9px 15px 0px 15px"
  }),
  dropdownIcon: {
    color: "#5c912e",
    height: 30,
    marginRight: 11,
    width: 30
  },
  dropdownIndicator: (provided, state) => ({
    ...provided,
    padding: "8px 16px 8px 14px"
  }),
  indicatorsContainer: (provided, state) => ({
    ...provided,
    height: 45
  }),
  indicatorSeparator: (provided, state) => ({
    ...provided,
    height: 32
  }),
  input: (provided, state) => ({
    ...provided,
    marginLeft: 0
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#f1f4f8" : "white",
    borderBottom: "1px solid #e2e7ee",
    color: "#333f52",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: "21px",
    paddingLeft: 13
  }),
  menu: (provided, state) => ({
    ...provided,
    margin: "5px 15px 0 15px",
    width: "-webkit-calc(100% - 30px)",
    width: "-moz-calc(100% - 30px)",
    width: "calc(100% - 30px)"
  }),
  menuList: (provided, state) => ({
    ...provided,
    // Don't show horizontal scrollbar
    overflowX: "hidden",
    paddingTop: 0
  }),
  // multiValue = Chip styling
  multiValue: (provided, state) => ({
    ...provided,
    backgroundColor: "#74ae43",
    borderRadius: "15.5px",
    height: "31",
    margin: "0 15px 0 0"
  }),
  multiValueLabel: (provided, state) => ({
    ...provided,
    color: "white",
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 21px 0 20px",
    // For some reason paddingLeft from above is ignored; put again here
    paddingLeft: "20px"
  }),
  multiValueRemove: (provided, state) => ({
    ...provided,
    padding: "0 9px 0 0",
    "&:hover": {
      backgroundColor: "transparent"
    }
  }),
  multiValueRemoveIcon: {
    backgroundColor: "white",
    borderRadius: 15,
    color: "#74ae43"
  },
  placeholder: (provided, state) => ({
    ...provided,
    color: "#333f52",
    fontSize: 14,
    margin: "1px 0 0 40px"
  }),
  searchIcon: {
    color: "#5c912e",
    height: 22,
    marginRight: 18,
    width: 22
  },
  valueContainer: (provided, state) => ({
    ...provided,
    paddingLeft: 14
  })
};

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.chipsFromSelectedFacetValues = this.chipsFromSelectedFacetValues.bind(
      this
    );
  }

  // renderOption is used to render 1) chip, 2) row in drop-down.
  renderOption = option => {
    // If option.label is set, we are rendering a chip.
    if (option.label != null) {
      return option.label;
    }
    if (option.facetValue != null && option.facetValue != "") {
      return (
        <div>
          <span style={{ color: "#cccfd4" }}>Add</span>
          <span> {option.facetName} </span>
          <span style={{ color: "#cccfd4" }}>facet and select</span>
          <span> {option.facetValue} </span>
        </div>
      );
    } else if (option.facetDescription != null) {
      return (
        <div>
          <span style={{ color: "#cccfd4" }}>Add</span>
          <span> {option.facetName} </span>
          <span style={{ color: "#cccfd4" }}>facet with description</span>
          <span> {option.facetDescription} </span>
        </div>
      );
    } else {
      return (
        <div>
          <span style={{ color: "#cccfd4" }}>Add</span>
          <span> {option.facetName} </span>
          <span style={{ color: "#cccfd4" }}>facet</span>
        </div>
      );
    }
  };
  renderValue = option => {
    // renderValue is used for autocomplete. If I type "foo" into search box,
    // drop-down options whose renderValue contains "foo" will be shown in the drop-down.
    if (option.value != null) {
      // Chips have a specific value, use that.
      return option.value;
    }
    if (option.facetDescription != null) {
      return option.facetName + " " + option.facetDescription;
    } else {
      return option.facetName;
    }
  };

  chipsFromSelectedFacetValues(selectedFacetValues) {
    let chips = [];
    selectedFacetValues.forEach((values, key) => {
      let facetName = this.props.facets.get(key).name;
      if (values.length > 0) {
        for (let value of values) {
          chips.push({
            label: facetName + "=" + value,
            value: key + "=" + value,
            esFieldName: key,
            facetName: facetName,
            facetValue: value
          });
        }
      }
    });
    return chips;
  }

  render() {
    // Put search icon before placeholder text. Note that after clicking in
    // search box, cursor should be right before "S" in "Search".
    const Placeholder = props => {
      return (
        <>
          <clr-icon shape="search" style={styles.searchIcon} />
          <components.Placeholder {...props} />
        </>
      );
    };

    const MultiValueRemove = props => {
      return (
        <components.MultiValueRemove {...props}>
          <clr-icon
            shape="times"
            style={styles.multiValueRemoveIcon}
            size="15"
          />
        </components.MultiValueRemove>
      );
    };

    const ClearIndicator = props => {
      const {
        getStyles,
        innerProps: { ref, ...restInnerProps }
      } = props;
      return (
        <div
          {...restInnerProps}
          ref={ref}
          style={getStyles("clearIndicator", props)}
        >
          <clr-icon shape="times" style={styles.clearIcon} size="29" />
        </div>
      );
    };

    const DropdownIndicator = (
      props: ElementConfig<typeof components.DropdownIndicator>
    ) => {
      const { getStyles } = props;
      return (
        <components.DropdownIndicator {...props} style={styles.dropdownIcon}>
          {DownAngleIcon}
        </components.DropdownIndicator>
      );
    };

    return (
      <AsyncSelect
        isMulti="true"
        onChange={this.props.handleSearchBoxChange}
        getOptionLabel={this.renderOption}
        getOptionValue={this.renderValue}
        value={this.chipsFromSelectedFacetValues(
          this.props.selectedFacetValues
        )}
        styles={styles}
        placeholder={this.props.searchPlaceholderText}
        loadOptions={this.props.loadOptions}
        defaultOptions={this.props.defaultOptions}
        components={{
          Placeholder,
          MultiValueRemove,
          ClearIndicator,
          DropdownIndicator
        }}
      />
    );
  }
}

export default Search;
