import React from "react";
import "@clr/icons";
import "@clr/icons/clr-icons.css";
import AsyncSelect from "react-select/lib/Async";
import { components } from "react-select";

// To get readable class names, add classNamePrefix="foo" to <AsyncSelect>
const styles = {
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
  // Left-align search box text with dataset name
  option: (provided, state) => ({
    ...provided,
    paddingLeft: 27
  }),
  // Chip background color
  multiValue: (provided, state) => ({
    ...provided,
    backgroundColor: "#ebedef"
  }),
  // Chip "x" hover color
  multiValueRemove: (provided, state) => ({
    ...provided,
    "&:hover": {
      backgroundColor: "#f6ccc5",
      color: "#db3214"
    }
  }),
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
    paddingLeft: 13
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
          <span style={{ color: "silver" }}>Add</span>
          <span style={{ color: "black" }}> {option.facetName} </span>
          <span style={{ color: "silver" }}>facet and select</span>
          <span style={{ color: "black" }}> {option.facetValue} </span>
        </div>
      );
    } else if (option.facetDescription != null) {
      return (
        <div>
          <span style={{ color: "silver" }}>Add</span>
          <span style={{ color: "black" }}> {option.facetName} </span>
          <span style={{ color: "silver" }}>facet with description</span>
          <span style={{ color: "black" }}> {option.facetDescription} </span>
        </div>
      );
    } else {
      return (
        <div>
          <span style={{ color: "silver" }}>Add</span>
          <span style={{ color: "black" }}> {option.facetName} </span>
          <span style={{ color: "silver" }}>facet</span>
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
    const ValueContainer = ({ children, ...props }) => (
      <components.ValueContainer {...props}>
        <clr-icon shape="search" style={styles.searchIcon} />
        {children}
      </components.ValueContainer>
    );

    return (
      <AsyncSelect
        classNamePrefix="foo"
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
        components={{ ValueContainer }}
      />
    );
  }
}

export default Search;
