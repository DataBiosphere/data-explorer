// Partially copied from https://github.com/DataBiosphere/saturn-ui/blob/dev/src/components/icons.js

import "@webcomponents/custom-elements"; // must be before icons

import "@clr/icons/clr-icons.css";
import { ClarityIcons } from "@clr/icons";
import React from "react";

import logowShadow from "./icons/logo-wShadow.svg";

ClarityIcons.add({
  logowShadow: "<img src='" + logowShadow + "' />"
});

export const logoGlow = <clr-icon shape="logowShadow" size="75" />;

// Clarity angle icon was too thick for Lou.
export const DownAngleIcon = (
  <svg
    width="20px"
    height="12px"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 12"
    enable-background="new 0 0 20 12"
  >
    <g transform="rotate(180 10 6)">
      <path
        d="M19.2 11.5c-.2 0-.4-.1-.6-.2L10 2.4l-8.6 8.8c-.3.3-.8.3-1.1 0S0 10.4.2 10L10 0l9.8 10c.2.2.3.6.2.9-.2.4-.5.6-.8.6z"
        fill="#5c912e"
      />
      <defs>
        <filter id="a" filterUnits="userSpaceOnUse">
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" />
        </filter>
      </defs>
      <mask maskUnits="userSpaceOnUse" id="b">
        <path
          d="M19.2 11.5c-.2 0-.4-.1-.6-.2L10 2.4l-8.6 8.8c-.3.3-.8.3-1.1 0S0 10.4.2 10L10 0l9.8 10c.2.2.3.6.2.9-.2.4-.5.6-.8.6z"
          fill-rule="evenodd"
          clip-rule="evenodd"
          fill="#fff"
          filter="url(#a)"
        />
      </mask>
      <g mask="url(#b)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          fill="#5c912e"
          d="M-5-13.714h30v30.9H-5z"
        />
      </g>
    </g>
  </svg>
);
