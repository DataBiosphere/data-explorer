import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { PrimaryButton } from "libs/common";

export default class CopyUrlButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonText: "Copy URL"
    };
    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  handleButtonClick() {
    // Just change the button text for a second
    this.setState({ buttonText: "Copied!" });
    setTimeout(() => this.setState({ buttonText: "Copy URL" }), 1000);
  }

  render() {
    const { className } = this.props;

    return (
      <div className={className}>
        <CopyToClipboard text={window.location.href}>
          <PrimaryButton onClick={this.handleButtonClick}>
            {this.state.buttonText}
          </PrimaryButton>
        </CopyToClipboard>
      </div>
    );
  }
}
