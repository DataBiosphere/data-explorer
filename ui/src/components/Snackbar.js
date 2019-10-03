import React from "react";
import IconButton from "@material-ui/core/IconButton";
import Slide from "@material-ui/core/Slide";
import MaterialUiSnackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";

import colors from "libs/colors";

const styles = {
  contentMessage: {
    fontWeight: 500,
    padding: 0,
    width: 200,
    wordWrap: "break-word"
  },
  contentRoot: {
    alignItems: "baseline",
    backgroundColor: "#525c6c",
    borderLeft: "5px solid " + colors.dark(),
    borderRadius: 5,
    fontSize: 12,
    minWidth: 228,
    padding: "8px 16px 20px 17px"
  },
  closeButton: {
    height: "24px",
    width: "24px",
    // Disable hover circle so we don't have to line it up with close icon
    "&:hover": {
      backgroundColor: "unset"
    }
  },
  closeIcon: {
    fontSize: "20px",
    opacity: 0.9
  },
  root: {
    right: 10,
    top: 75
  }
};

function TransitionLeft(props) {
  return <Slide {...props} direction="left" />;
}

class Snackbar extends React.Component {
  state = {
    open: true
  };

  render() {
    const { classes, message, type } = this.props;

    if (type === "warning") {
      styles.contentRoot.backgroundColor = colors.warning();
      styles.contentRoot.borderLeft = "5px solid #dc8412";
    }

    return (
      <MaterialUiSnackbar
        className={classes.root}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        open={this.state.open}
        onClose={this.handleClose}
        TransitionComponent={TransitionLeft}
      >
        <SnackbarContent
          style={styles.contentRoot}
          classes={{
            message: classes.contentMessage
          }}
          message={message}
          action={[
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              onClick={this.handleClose}
              className={classes.closeButton}
            >
              <CloseIcon className={classes.closeIcon} />
            </IconButton>
          ]}
        />
      </MaterialUiSnackbar>
    );
  }

  handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    this.setState({ open: false });
  };
}

export default withStyles(styles)(Snackbar);
