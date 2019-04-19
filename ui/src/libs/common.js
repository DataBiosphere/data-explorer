// Recreate buttons rather than copy from terra-ui, so we don't
// have to deal with lodash/hyperscript.

import React from "react";
import Button from "@material-ui/core/Button";
import classNames from "classnames";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";

const baseStyles = {
  buttonBase: {
    borderRadius: 5,
    padding: "7px 15px 3px 15px",
    textTransform: "uppercase",
    whiteSpace: "nowrap"
  }
};

const elementStyles = {
  primaryButton: {
    ...baseStyles.buttonBase,
    backgroundColor: colors.green[1],
    border: "1px solid " + colors.green[0],
    color: "white",
    "&:hover": {
      backgroundColor: colors.green[2]
    },
    "&$primaryButtonDisabled": {
      backgroundColor: colors.gray[5],
      border: "1px solid " + colors.gray[4],
      color: "white"
    }
  },
  primaryButtonDisabled: {},
  secondaryButton: {
    ...baseStyles.buttonBase,
    border: "1px solid transparent",
    color: colors.green[0],
    "&:hover": {
      backgroundColor: "unset",
      color: colors.green[1]
    }
  },
  tooltip: {
    backgroundColor: "black",
    borderRadius: 4,
    fontSize: 14,
    padding: "8px 8px 4px 8px"
  }
};

const PrimaryButton = withStyles(elementStyles)(function(props) {
  const { classes, ...otherProps } = props;
  return (
    <Button
      classes={{
        root: classes.primaryButton,
        disabled: classNames(
          classes.primaryButton,
          classes.primaryButtonDisabled
        )
      }}
      disableRipple={true}
      {...otherProps}
    />
  );
});

const SecondaryButton = withStyles(elementStyles)(function(props) {
  const { classes, className, ...otherProps } = props;
  return (
    <Button
      className={classNames(className, classes.secondaryButton)}
      disableRipple={true}
      {...otherProps}
    />
  );
});

export { elementStyles, PrimaryButton, SecondaryButton };
