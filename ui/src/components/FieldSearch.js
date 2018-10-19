import React from "react";
import Select, { components } from "react-select";

const MultiValue = props => (
  <components.MultiValue {...props}>
    {props.data.chipLabel}
  </components.MultiValue>
);

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
        components={{ MultiValue }}
        value={this.props.extraFacetsOptions}
      />
    );
  }
}

export default FieldSearch;
