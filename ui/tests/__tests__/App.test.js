import React from "react";
import App from "../../src/App";
import { mockFacetsGet } from "../../src/api/src/api/FacetsApi";
import { mockDatasetGet } from "../../src/api/src/api/DatasetApi";

jest.mock("../../src/api/src/api/DatasetApi");
jest.mock("../../src/api/src/api/FacetsApi");
("use strict");

beforeEach(() => {
  mockFacetsGet.mockClear();
  mockDatasetGet.mockClear();
});

test("Renders an empty div before receiving all data", () => {
  mockDatasetGet.mockImplementationOnce(() => {});
  const tree = shallow(<App />);

  expect(tree).toMatchSnapshot();
});

test("Renders correctly after receiving all data", () => {
  const tree = shallow(<App />);

  expect(tree).toMatchSnapshot();
});

test("Stringifies queries when calling the API to update Facets", () => {
  const tree = shallow(<App />);
  tree.instance().updateFacets("Facet 1", "FacetValue 1", true);
  tree.instance().updateFacets("Facet 1", "FacetValue 2", true);
  tree.instance().updateFacets("Facet 1", "FacetValue 1", false);

  expect(mockFacetsGet).toHaveBeenCalledWith(
    {},
    tree.instance().facetsCallback
  );
  expect(mockFacetsGet).toHaveBeenCalledWith(
    { filter: ["Facet 1=FacetValue 1"] },
    tree.instance().facetsCallback
  );
  expect(mockFacetsGet).toHaveBeenCalledWith(
    { filter: ["Facet 1=FacetValue 1", "Facet 1=FacetValue 2"] },
    tree.instance().facetsCallback
  );
  expect(mockFacetsGet).toHaveBeenCalledWith(
    { filter: ["Facet 1=FacetValue 2"] },
    tree.instance().facetsCallback
  );
});
