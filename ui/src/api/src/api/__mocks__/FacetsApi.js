import FacetsResponse from "../../model/FacetsResponse";
import FieldsResponse from "../../model/FieldsResponse";
import { getFacetsList } from "../../../../../tests/unit/mockutils";
import { getFieldsList } from "../../../../../tests/unit/mockutils";

export const mockFacetsGet = jest.fn((request, callback) => {
  let getFacetsResponse = new FacetsResponse();
  getFacetsResponse.count = 210;
  getFacetsResponse.facets = getFacetsList(2, 2);
  callback(null, getFacetsResponse, request);
  return getFacetsResponse;
});

export const mockFieldsGet = jest.fn(callback => {
  let getFieldsResponse = new FieldsResponse();
  getFieldsResponse.fields = getFieldsList(2);
  callback(null, getFieldsResponse, null);
  return getFieldsResponse;
});

const mock = jest.fn().mockImplementation(() => {
  return {
    facetsGet: mockFacetsGet,
    fieldsGet: mockFieldsGet
  };
});

export default mock;
