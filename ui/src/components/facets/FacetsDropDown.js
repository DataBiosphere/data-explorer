import "./FacetsDropDown.css";

import React, { Component } from "react";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from 'material-ui/MenuItem';


function FacetsDropDown(props) {
  const facets = props.facets;
  const updateFacets = props.updateFacets;
  const handleChange = props.handleChange;
  const state = props.state
  const facetsList = facets.map((facet, idx) => (
      <MenuItem value={idx} primaryText={facet.name} />
  ));
  return (<DropDownMenu value={state.value} onChange={handleChange}>
    {facetsList}
  </DropDownMenu>

  );
}

export default FacetsDropDown;
