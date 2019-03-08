// Partially copied from https://github.com/DataBiosphere/saturn-ui/blob/dev/src/components/icons.js

import "@webcomponents/custom-elements"; // must be before icons

import "@clr/icons/clr-icons.css";
import { ClarityIcons } from "@clr/icons";
import React from "react";

import colors from "libs/colors";
import downAngleSvg from "./icons/down-angle.svg";
import logowShadow from "./icons/logo-wShadow.svg";

ClarityIcons.add({
  // Can't chage color with "<img src". So use "<img src" for icons where we
  // don't need to change color.
  downAngle: "<img src='" + downAngleSvg + "' />",
  logowShadow: "<img src='" + logowShadow + "' />"
});

export const logoGlow = <clr-icon shape="logowShadow" size="75" />;

export const downAngle = (
  <clr-icon shape="downAngle" width="20px" height="12px" />
);

export const CheckboxStyles = {
  checkboxRoot: {
    border: "1px solid " + colors.gray[5],
    borderRadius: 3,
    height: 14,
    width: 14,
    "&:hover": {
      border: "1px solid " + colors.green[1]
    },
    "&$checkboxChecked": {
      border: "1px solid " + colors.green[0]
    }
  },
  checkboxChecked: {},
  checkedIcon: {
    fill: colors.green[1],
    height: 16,
    width: 16,
    // Needed for hover color to work
    zIndex: 2,
    "&:hover": {
      fill: colors.green[2]
    }
  }
};
