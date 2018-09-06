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
        // If margin were in fieldSearchTextField css, it would overridden by
        // margin from a different class (MuiFormControl-root-1). So margin
        // needs to be set here.
        style={{'margin': '0px 0px 40px 12px'}}
      />
    )
  }
}

export default FieldSearchTextField;
