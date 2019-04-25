import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { PrimaryButton, TerraTooltip } from "libs/common";
import "@clr/icons/clr-icons.css";

const style = {
  copyUrlButton: {
    marginRight: "16px"
  }
};

export default class CopyUrlButton extends React.Component {
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
    return (
      <div onClick={this.handleButtonClick} style={style.copyUrlButton}>
        <TerraTooltip title={this.state.buttonText}>
          <CopyToClipboard text={window.location.href}>
            <clr-icon shape="copy-to-clipboard" size="20" />
          </CopyToClipboard>
        </TerraTooltip>
      </div>
    );
  }
}
