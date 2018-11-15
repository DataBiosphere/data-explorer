import React from "react";
import Select, { components } from "react-select";

class Search extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Select
        isMulti="true"
        onChange={this.props.handleSearch}
        options={this.props.searchResults}
        value={[]} // This will change in the next PR when we add chips from filters.
      />
    );
  }
}

export default Search;
