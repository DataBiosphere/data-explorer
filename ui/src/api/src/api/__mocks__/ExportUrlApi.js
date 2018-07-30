import ExportUrlResponse from "../../model/ExportUrlResponse";

export const mockExportUrlPost = jest.fn(callback => {
  let postExportUrlResponse = new ExportUrlResponse();
  postExportUrlResponse.url = "exportUrl";
  callback(null, postExportUrlResponse);
  return postExportUrlResponse;
});

const mock = jest.fn().mockImplementation(() => {
  return {
    exportUrlPost: mockExportUrlPost
  };
});

export default mock;
