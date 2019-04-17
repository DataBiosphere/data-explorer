// Copied from terra-ui src/components/common.js

import _ from "lodash/fp";
import { h } from "react-hyperscript-helpers";
import Interactive from "react-interactive";

import colors from "libs/colors";

const styles = {
  button: {
    display: "inline-flex",
    justifyContent: "space-around",
    alignItems: "center",
    height: "2.25rem",
    fontWeight: 500,
    fontSize: 14,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    userSelect: "none"
  }
};

export const Clickable = ({
  as = "div",
  disabled,
  tooltip,
  tooltipSide,
  onClick,
  children,
  ...props
}) => {
  const child = h(
    Interactive,
    _.merge(
      {
        as,
        disabled,
        onClick: (...args) => onClick && !disabled && onClick(...args)
      },
      props
    ),
    [children]
  );

  return child;
  /*
  if (tooltip) {
    return h(TooltipTrigger, { content: tooltip, side: tooltipSide }, [child])
  } else {
    return child
  }
*/
};

export const buttonPrimary = ({ disabled, ...props }, children) => {
  return h(
    Clickable,
    _.merge(
      {
        disabled,
        style: {
          ...styles.button,
          border: `1px solid ${disabled ? colors.gray[4] : colors.green[0]}`,
          borderRadius: 5,
          color: "white",
          padding: "0.875rem",
          backgroundColor: disabled ? colors.gray[5] : colors.green[1],
          cursor: disabled ? "not-allowed" : "pointer"
        },
        hover: disabled ? undefined : { backgroundColor: colors.green[2] }
      },
      props
    ),
    children
  );
};
