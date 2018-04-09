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

test("Renders the app empty before receiving all data", () => {
  mockDatasetGet.mockImplementationOnce(() => {});
  const tree = shallow(<App />);

  expect(tree).toMatchSnapshot();
  expect(mockFacetsGet).toHaveBeenCalledTimes(1);
  expect(mockDatasetGet).toHaveBeenCalledTimes(1);
});

test("Renders the app after receiving data", () => {
  const tree = shallow(<App />);

  expect(tree).toMatchSnapshot();
  expect(mockFacetsGet).toHaveBeenCalledTimes(1);
  expect(mockDatasetGet).toHaveBeenCalledTimes(1);
});

test("Stringifies queries when calling the API to update Facets", () => {
  const tree = shallow(<App />);
  tree.instance().updateFacets("Facet 1", "FacetValue 1", true);
  tree.instance().updateFacets("Facet 1", "FacetValue 2", true);
  tree.instance().updateFacets("Facet 1", "FacetValue 1", false);
  tree.instance().updateFacets("Facet 1", "FacetValue 2", false);

  expect(mockFacetsGet).toHaveBeenCalledTimes(5);
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

test("De-selecting already unselected facet does nothing", () => {
  const tree = shallow(<App />);
  tree.instance().updateFacets("Facet 1", "FacetValue 1", false);

  expect(mockFacetsGet).toHaveBeenCalledTimes(2);
  expect(mockFacetsGet).toHaveBeenCalledWith(
    {},
    tree.instance().facetsCallback
  );
});

test("Error getting facets does nothing", () => {
  mockFacetsGet.mockImplementationOnce((request, callback) => {
    callback("Expected error for get facets", null, null);
    return null;
  });

  const tree = shallow(<App />);
  // TODO(alanhwang): Update the test here when error behavior is implemented
});

test("Error getting dataset does nothing", () => {
  mockDatasetGet.mockImplementationOnce(callback => {
    callback("Expected error for get dataset", null, null);
    return null;
  });

  const tree = shallow(<App />);
  // TODO(alanhwang): Update the test here when error behavior is implemented
});
