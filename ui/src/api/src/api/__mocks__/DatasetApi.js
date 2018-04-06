import DatasetResponse from "../../model/DatasetResponse";

export const mockDatasetGet = jest.fn(callback => {
  let response = new DatasetResponse();
  response.name = "Test Dataset Name";
  return response;
});

const mock = jest.fn().mockImplementation(() => {
  return {
    datasetGet: mockDatasetGet
  };
});

export default mock;
