import React from "react";
import Select from "react-select";

const options = [{ label: "A", value: "A" }, { label: "B", value: "B" }];

class FieldSearch extends React.Component {
  constructor(props) {
    const fields = props.fields;
    super(props);
    this.state = {
      fields: fields
    };
  }

  render() {
    return (
      <Select
        isMulti="true"
        onChange={this.handleChange}
        options={this.state.fields}
      />
    );
  }

  handleChange(selectedOption) {
    console.log(`Option selected:`, selectedOption);
  }
}

export default FieldSearch;
