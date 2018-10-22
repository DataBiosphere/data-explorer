import React from "react";
import Select, { components } from "react-select";

// MultiValue is used to set a custom chip label.
// We want to show different text in chip vs drop-down, since description can be long.
// See https://stackoverflow.com/questions/52482985/react-select-show-different-text-label-for-drop-down-and-control
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
