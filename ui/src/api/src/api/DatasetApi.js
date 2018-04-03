/**
 * Data Explorer Service
 * API Service that reads from Elasticsearch.
 *
 * OpenAPI spec version: 0.0.1
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

import ApiClient from "../ApiClient";
import DatasetResponse from "../model/DatasetResponse";

/**
 * Dataset service.
 * @module api/DatasetApi
 * @version 0.0.1
 */
export default class DatasetApi {
  /**
   * Constructs a new DatasetApi.
   * @alias module:api/DatasetApi
   * @class
   * @param {module:ApiClient} [apiClient] Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  constructor(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;
  }

  /**
   * Callback function to receive the result of the datasetGet operation.
   * @callback module:api/DatasetApi~datasetGetCallback
   * @param {String} error Error message, if any.
   * @param {module:model/DatasetResponse} data The data returned by the service call.
   * @param {String} response The complete HTTP response.
   */

  /**
   * Gets dataset information, such as name.
   * @param {module:api/DatasetApi~datasetGetCallback} callback The callback function, accepting three arguments: error, data, response
   * data is of type: {@link module:model/DatasetResponse}
   */
  datasetGet(callback) {
    let postBody = null;

    let pathParams = {};
    let queryParams = {};
    let headerParams = {};
    let formParams = {};

    let authNames = [];
    let contentTypes = [];
    let accepts = [];
    let returnType = DatasetResponse;

    return this.apiClient.callApi(
      "/dataset",
      "GET",
      pathParams,
      queryParams,
      headerParams,
      formParams,
      postBody,
      authNames,
      contentTypes,
      accepts,
      returnType,
      callback
    );
  }
}
