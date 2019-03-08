// Partially copied from https://github.com/DataBiosphere/saturn-ui/blob/dev/src/components/icons.js

import "@webcomponents/custom-elements"; // must be before icons

import "@clr/icons/clr-icons.css";
import { ClarityIcons } from "@clr/icons";
import React from "react";
import { renderToString } from "react-dom/server";

import colors from "libs/colors";
import downAngleSvg from "./icons/down-angle.svg";
import logowShadow from "./icons/logo-wShadow.svg";
// Specify raw-loader here. This way, we don't have to mess with
// react-app-rewired/webpack.config.js (like saturn-ui does).
import CheckSquareSvg from "!raw-loader!./icons/check-square.svg"; // eslint-disable-line import/no-webpack-loader-syntax

ClarityIcons.add({
  // Can't chage color with "<img src". So use "<img src" for icons where we
  // don't need to change color.
  downAngle: "<img src='" + downAngleSvg + "' />",
  logowShadow: "<img src='" + logowShadow + "' />",
  checkSquare: CheckSquareSvg
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
      border: "1px solid " + colors.green[0],
      color: colors.green[1],
      "&:hover": {
        color: colors.green[2]
      }
    }
  },
  checkboxChecked: {}
};

export const CheckSquare = function(props) {
  // For some reason embedded path is 14x14. Tranform makes it 16x16. Otherwise,
  // there is whitespace between square and CSS border.
  return (
    <clr-icon
      shape="checkSquare"
      width="16px"
      height="16px"
      style={{ transform: "scale(1.143, 1.143)" }}
    />
  );
};
