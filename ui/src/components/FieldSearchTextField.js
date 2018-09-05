import "./FieldSearchTextField.css";

import React from "react";
import TextField from "@material-ui/core/TextField";

class FieldSearchTextField extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TextField
        className="fieldSearchTextField"
        label="Explore facets"
        placeholder= "e.g. age, exome"
        // margin doesn't work if in fieldSearchTextField css, so put here.
        style={{'margin': '0px 0px 40px 8px'}}
      />
    )
  }
}

export default FieldSearchTextField;
