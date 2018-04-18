import Facet from "../../src/api/src/model/Facet";
import FacetValue from "../../src/api/src/model/FacetValue";

// Utilities for setting up test instances

/** @param numFacets the desired number of Facets to generate
 *  @param numValues the number of FacetValues attached to each Facet
 *  @return Facet[] a list of facets */
export function getFacetsList(numFacets, numValues) {
  let facets = [];
  for (let i = 1; i <= numFacets; i++) {
    facets.push(getFacet("Facet " + i, numValues));
  }
  return facets;
}

export function getFacet(facetName, numValues) {
  let facet = new Facet();
  facet.name = facetName;
  facet.values = [];
  for (let i = 1; i <= numValues; i++) {
    facet.values.push(getFacetValue(i));
  }
  return facet;
}

function getFacetValue(i) {
  let value = new FacetValue();
  value.name = "FacetValue " + i;
  value.count = i * 10;
  return value;
}
