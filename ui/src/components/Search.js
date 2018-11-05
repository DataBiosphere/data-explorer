import React from "react";
import Select, { components } from "react-select";

class Search extends React.Component {
  constructor(props) {
    super(props);
  }

  // renderOption is used to render the drop-down
  renderOption = option => {
    // Chips have a specific label, use that.
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
      return option.value;
    }
    if (option.facetDescription != null) {
      return option.facetName + " " + option.facetDescription;
    } else {
      return option.facetName;
    }
  };

  render() {
    return (
      <Select
        isMulti="true"
        onChange={this.props.handleSearch}
        options={this.props.searchResults}
        getOptionLabel={this.renderOption}
        getOptionValue={this.renderValue}
        value={this.props.chips}
      />
    );
  }
}

export default Search;
