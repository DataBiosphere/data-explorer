import React from "react";
import "@clr/icons/clr-icons.css";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { PrimaryButton, TerraTooltip } from "libs/common";
import { withStyles } from "@material-ui/core/styles";

const styles = {
  button: {
    color: "#7f8fa4",
    marginLeft: 16
  }
};

class CopyUrlButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonText: "Copy URL to clipboard"
    };
    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  handleButtonClick() {
    // Just change the button text for a second
    this.setState({ buttonText: "Copied!" });
    setTimeout(
      () => this.setState({ buttonText: "Copy URL to clipboard" }),
      1000
    );
  }

  render() {
    const { classes } = this.props;

    return (
      <div onClick={this.handleButtonClick} className={classes.button}>
        <TerraTooltip title={this.state.buttonText}>
          <CopyToClipboard text={window.location.href}>
            <clr-icon shape="copy-to-clipboard" size="16" />
          </CopyToClipboard>
        </TerraTooltip>
      </div>
    );
  }
}

export default withStyles(styles)(CopyUrlButton);
