import FacetsResponse from "../../model/FacetsResponse";
import { getFacetsList } from "../../../../../tests/mockutils";

export const mockFacetsGet = jest.fn((request, callback) => {
  let getFacetsResponse = new FacetsResponse();
  getFacetsResponse.count = 210;
  getFacetsResponse.facets = getFacetsList(3, 4);
  callback(null, getFacetsResponse, request);
  return getFacetsResponse;
});

const mock = jest.fn().mockImplementation(() => {
  return {
    facetsGet: mockFacetsGet
  };
});

export default mock;
