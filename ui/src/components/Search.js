import React from "react";
import "@clr/icons";
import "@clr/icons/clr-icons.css";
import AsyncSelect from "react-select/lib/Async";

// To get readable class names, add classNamePrefix="foo" to <AsyncSelect>
const customStyles = {
  container: (provided, state) => ({
    ...provided,
    fontFamily: ["Montserrat", "sans-serif"].join(","),
    fontSize: 13
  }),
  control: (provided, state) => ({
    ...provided,
    // Remove 1 pixel border to the left and right of search box
    border: 0,
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
  valueContainer: (provided, state) => ({
    ...provided,
    marginLeft: 17
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
    const placeholder = (
      <React.Fragment>
        <clr-icon shape="search" size="22" />
        {this.props.searchPlaceholderText}
      </React.Fragment>
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
        styles={customStyles}
        placeholder={placeholder}
        loadOptions={this.props.loadOptions}
        defaultOptions={this.props.defaultOptions}
      />
    );
  }
}

export default Search;
