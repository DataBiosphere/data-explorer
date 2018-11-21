import React from "react";
import Select, { components } from "react-select";

const customStyles = {
  container: (provided, state) => ({
    ...provided,
    fontFamily: ["Montserrat", "sans-serif"].join(","),
    fontSize: "13px"
  })
};

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.facetNameMap = this.getFacetNameMap(this.props.facets);
    this.chipsFromFilter = this.chipsFromFilter.bind(this);
  }

  getFacetNameMap(facets) {
    var facetNameMap = new Map();
    facets.forEach(function(facet) {
      facetNameMap.set(facet.es_field_name, facet.name);
    });
    return facetNameMap;
  }

  // renderOption is used to render 1) chip, 2) row in drop-down.
  renderOption = option => {
    // If option.label is set, we are rendering a chip.
    if (option.label != null) {
      return option.label;
    }
    if (option.facetDescription != null) {
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

  chipsFromFilter(filterMap) {
    let chips = [];
    filterMap.forEach((values, key) => {
      let facetName = this.facetNameMap.get(key);
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
    return (
      <Select
        isMulti="true"
        onChange={this.props.handleSearchBoxChange}
        options={this.props.searchResults}
        getOptionLabel={this.renderOption}
        getOptionValue={this.renderValue}
        value={this.chipsFromFilter(this.props.selectedFacetValues)}
        styles={customStyles}
      />
    );
  }
}

export default Search;
