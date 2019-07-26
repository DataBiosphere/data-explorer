import React from "react";
import "@clr/icons";
import "@clr/icons/shapes/essential-shapes.min.js";
import "@clr/icons/clr-icons.css";
import AsyncSelect from "react-select/lib/Async";
import { components } from "react-select";
import { withStyles } from "@material-ui/core/styles";

import colors from "libs/colors";
import { ReactComponent as DownAngle } from "libs/icons/down-angle.svg";
import { DownAngleStyles } from "libs/icons";

const materialUiStyles = {
  ...DownAngleStyles
};

// styles passed to <AsyncSelect>
// To get readable class names, add classNamePrefix="foo" to <AsyncSelect>
const styles = {
  clearIndicator: (provided, state) => ({
    ...provided,
    color: "#5c912e"
  }),
  container: (provided, state) => ({
    ...provided,
    fontFamily: ["Montserrat", "sans-serif"].join(","),
    fontSize: 13,
    marginLeft: 15,
    width: "100%"
  }),
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#ebedef",
    border: 0,
    borderRadius: 5,
    ...(state.isFocused
      ? {
          boxShadow: "0 0 0 1px " + colors.success()
        }
      : {})
  }),
  dropdownIcon: {
    color: "#5c912e",
    height: 30,
    marginRight: 11,
    width: 30
  },
  dropdownIndicator: (provided, state) => ({
    ...provided,
    padding: "8px 16px 8px 14px"
  }),
  indicatorsContainer: (provided, state) => ({
    ...provided,
    height: 45
  }),
  indicatorSeparator: (provided, state) => ({
    ...provided,
    height: 32
  }),
  input: (provided, state) => ({
    ...provided,
    margin: "0 0 5px 0"
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#f1f4f8" : "white",
    borderBottom: "1px solid #e2e7ee",
    color: "#333f52",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: "21px",
    paddingLeft: 13
  }),
  menu: (provided, state) => ({
    ...provided,
    borderRadius: 5,
    marginTop: 3
  }),
  menuList: (provided, state) => ({
    ...provided,
    // Don't show horizontal scrollbar
    overflowX: "hidden",
    paddingTop: 0
  }),
  // multiValue = Chip styling
  multiValue: (provided, state) => ({
    ...provided,
    backgroundColor: "#ced8e3",
    borderRadius: "15.5px",
    height: "31",
    margin: "0 15px 7px 0"
  }),
  multiValueLabel: (provided, state) => ({
    ...provided,
    color: colors.dark(),
    fontSize: 12,
    fontWeight: 500,
    // For some reason different line-heights are needed for Mac Chrome vs
    // Linux Chrome, to make chip text vertically centered in chip.
    lineHeight: navigator.platform.includes("Mac") ? "10px" : "13px",
    padding: "10px 21px 0 20px",
    // For some reason paddingLeft from above is ignored; put again here
    paddingLeft: "20px"
  }),
  multiValueRemove: (provided, state) => ({
    ...provided,
    padding: "0 9px 0 0",
    "&:hover": {
      backgroundColor: "transparent"
    }
  }),
  multiValueRemoveIcon: {
    color: "#8f96a1"
  },
  placeholder: (provided, state) => ({
    ...provided,
    color: "#333f52",
    fontSize: 14,
    margin: "1px 0 0 40px"
  }),
  searchIcon: {
    color: "#5c912e",
    height: 22,
    margin: "-7px 18px 0 0",
    width: 22
  },
  valueContainer: (provided, state) => ({
    ...provided,
    padding: "7px 0 0 14px"
  })
};

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.chipsFromSelectedFacetValues = this.chipsFromSelectedFacetValues.bind(
      this
    );
  }

  // renderOption is used to render 1) chip, 2) row in drop-down.
  renderOption = option => {
    // If option.label is set, we are rendering a chip.
    if (option.label != null) {
      return option.label;
    }
    if (option.facetValue !== null && option.facetValue !== "") {
      if (option.isTimeSeries) {
        let fieldNameArr = option.esFieldName.split(".");
        return (
          <div>
            <span style={{ color: "#cccfd4" }}>Add</span>
            <span> {option.facetName} </span>
            <span style={{ color: "#cccfd4" }}>facet and select</span>
            <span> {option.facetValue} </span>
            <span style={{ color: "#cccfd4" }}>
              at {this.props.timeSeriesUnit}
            </span>
            <span> {fieldNameArr[fieldNameArr.length - 1]} </span>
          </div>
        );
      } else {
        return (
          <div>
            <span style={{ color: "#cccfd4" }}>Add</span>
            <span> {option.facetName} </span>
            <span style={{ color: "#cccfd4" }}>facet and select</span>
            <span> {option.facetValue} </span>
          </div>
        );
      }
    } else if (option.facetDescription != null) {
      return (
        <div>
          <span style={{ color: "#cccfd4" }}>Add</span>
          <span> {option.facetName} </span>
          <span style={{ color: "#cccfd4" }}>facet with description</span>
          <span> {option.facetDescription} </span>
        </div>
      );
    } else {
      return (
        <div>
          <span style={{ color: "#cccfd4" }}>Add</span>
          <span> {option.facetName} </span>
          <span style={{ color: "#cccfd4" }}>facet</span>
        </div>
      );
    }
  };
  renderValue = option => {
    // renderValue is used for autocomplete. If I type "foo" into search box,
    // drop-down options whose renderValue contains "foo" will be shown in the drop-down.
    if (option.value != null) {
      // Chips have a specific value, use that.
      return option.value;
    }
    if (option.facetDescription != null) {
      return option.facetName + " " + option.facetDescription;
    } else {
      return option.facetName;
    }
  };

  chipsFromSelectedFacetValues(selectedFacetValues) {
    let chips = [];
    selectedFacetValues.forEach((values, key) => {
      let keySplit = key.split(".");
      let facetName = this.props.facets.has(key)
        ? this.props.facets.get(key).name
        : this.props.facets.get(keySplit.slice(0, -1).join(".")).name +
          " (" +
          this.props.timeSeriesUnit +
          " " +
          keySplit[keySplit.length - 1] +
          ")";
      if (values.length > 0) {
        for (let value of values) {
          chips.push({
            label: facetName + "=" + value,
            value: key + "=" + value,
            esFieldName: key,
            facetName: facetName,
            facetValue: value
          });
        }
      }
    });
    return chips;
  }

  render() {
    const { classes } = this.props;

    // Put search icon before placeholder text. Note that after clicking in
    // search box, cursor should be right before "S" in "Search".
    const Placeholder = props => {
      return (
        <>
          <clr-icon shape="search" style={styles.searchIcon} />
          <components.Placeholder {...props} />
        </>
      );
    };

    const MultiValueRemove = props => {
      return (
        <components.MultiValueRemove {...props}>
          <clr-icon
            shape="times-circle"
            class="is-solid"
            style={styles.multiValueRemoveIcon}
            size="15"
          />
        </components.MultiValueRemove>
      );
    };

    const ClearIndicator = props => {
      const {
        getStyles,
        innerProps: { ref, ...restInnerProps }
      } = props;
      return (
        <div
          {...restInnerProps}
          ref={ref}
          style={getStyles("clearIndicator", props)}
        >
          <clr-icon shape="times" size="29" />
        </div>
      );
    };

    const DropdownIndicator = (
      props: ElementConfig<typeof components.DropdownIndicator>
    ) => {
      return (
        <components.DropdownIndicator {...props} style={styles.dropdownIcon}>
          <DownAngle className={classes.downAngle} />
        </components.DropdownIndicator>
      );
    };

    return (
      <AsyncSelect
        isMulti="true"
        onChange={this.props.handleSearchBoxChange}
        getOptionLabel={this.renderOption}
        getOptionValue={this.renderValue}
        value={this.chipsFromSelectedFacetValues(
          this.props.selectedFacetValues
        )}
        styles={styles}
        placeholder={this.props.searchPlaceholderText}
        loadOptions={this.props.loadOptions}
        defaultOptions={this.props.defaultOptions}
        components={{
          Placeholder,
          MultiValueRemove,
          ClearIndicator,
          DropdownIndicator
        }}
      />
    );
  }
}

export default withStyles(materialUiStyles)(Search);
