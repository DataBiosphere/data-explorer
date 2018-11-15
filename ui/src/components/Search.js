import React from "react";
import Select, { components } from "react-select";

class Search extends React.Component {
  constructor(props) {
    super(props);
  }
  renderOption = option => {
    if (option.facetDescription != null) {
      return (
        <div>
          <span style={{ color: "grey" }}>Add</span>
          <span style={{ color: "black" }}> {option.facetName} </span>
          <span style={{ color: "grey" }}>facet with description</span>
          <span style={{ color: "black" }}> {option.facetDescription} </span>
        </div>
      );
    } else {
      return (
        <div>
          <span style={{ color: "grey" }}>Add</span>
          <span style={{ color: "black" }}> {option.facetName} </span>
          <span style={{ color: "grey" }}>facet</span>
        </div>
      );
    }
  };
  renderValue = option => {
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
        value={[]} // This will change in the next PR when we add chips from filters.
      />
    );
  }
}

export default Search;
