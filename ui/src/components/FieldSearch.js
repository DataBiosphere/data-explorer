import React from "react";
import Select from "react-select";

class FieldSearch extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Select
        isMulti="true"
        onChange={this.props.handleChange}
        options={this.props.fields}
        value={this.props.extraFacetsOptions}
        controlShouldRenderValue={false}
      />
    );
  }
}

export default FieldSearch;
