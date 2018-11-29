import React from "react";
import Select, { components } from "react-select";
import AsyncSelect from "react-select/lib/Async";

const customStyles = {
  container: (provided, state) => ({
    ...provided,
    fontFamily: ["Lato", "sans-serif"].join(","),
    fontSize: "13px"
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
    if (this.props.enableSearchValues) {
      return (
        <AsyncSelect
          isMulti="true"
          onChange={this.props.handleSearchBoxChange}
          getOptionLabel={this.renderOption}
          getOptionValue={this.renderValue}
          value={this.chipsFromSelectedFacetValues(
            this.props.selectedFacetValues
          )}
          styles={customStyles}
          placeholder={this.props.searchPlaceholderText}
          loadOptions={this.props.loadOptions}
          defaultOptions={this.props.defaultOptions}
        />
      );
    } else {
      return (
        <Select
          isMulti="true"
          onChange={this.props.handleSearchBoxChange}
          getOptionLabel={this.renderOption}
          getOptionValue={this.renderValue}
          value={this.chipsFromSelectedFacetValues(
            this.props.selectedFacetValues
          )}
          styles={customStyles}
          placeholder={this.props.searchPlaceholderText}
          options={this.props.defaultOptions}
        />
      );
    }
  }
}

export default Search;
