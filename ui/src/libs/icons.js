// Partially copied from https://github.com/DataBiosphere/saturn-ui/blob/dev/src/components/icons.js

import "@webcomponents/custom-elements"; // must be before icons

import "@clr/icons/clr-icons.css";
import { ClarityIcons } from "@clr/icons";
import React from "react";

import downAngleSvg from "./icons/down-angle.svg";
import logowShadow from "./icons/logo-wShadow.svg";

ClarityIcons.add({
  downAngle: "<img src='" + downAngleSvg + "' />",
  logowShadow: "<img src='" + logowShadow + "' />"
});

export const logoGlow = <clr-icon shape="logowShadow" size="75" />;

export const downAngle = (
  <clr-icon shape="downAngle" width="20px" height="12px" />
);
