import FacetsResponse from "../../model/FacetsResponse";
import { getFacetsList } from "../../../../../tests/mockutils";

export const mockFacetsGet = jest.fn(callback => {
  let getFacetsResponse = new FacetsResponse();
  getFacetsResponse.count = 210;
  getFacetsResponse.facets = getFacetsList(5, 6);
  return getFacetsResponse;
});

const mock = jest.fn().mockImplementation(() => {
  return {
    facetsGet: mockFacetsGet
  };
});

export default mock;
