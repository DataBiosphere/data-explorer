import { getFacetsList } from "../../../../tests/mockutils";
import FacetsResponse from "../model/FacetsResponse";

export const mockCallApi = jest.fn(
  (
    path,
    httpMethod,
    pathParams,
    queryParams,
    headerParams,
    formParams,
    bodyParam,
    authNames,
    contentTypes,
    accepts,
    returnType,
    callback
  ) => {
    if (path === "facets" && httpMethod === "GET") {
      let getFacetsResponse = new FacetsResponse();
      getFacetsResponse.count = 210;
      getFacetsResponse.facets = getFacetsList(5, 6);
      return getFacetsResponse;
    }
    return null;
  }
);
const mock = jest.fn().mockImplementation(() => {
  return {
    callApi: mockCallApi,
    buildCollectionParam: jest.fn()
  };
});

export default mock;
