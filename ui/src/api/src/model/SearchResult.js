/* eslint-disable */
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

/**
 * The SearchResult model module.
 * @module model/SearchResult
 * @version 0.0.1
 */
export default class SearchResult {
  /**
   * Constructs a new <code>SearchResult</code>.
   * Can represent a facet (Gender), or a facet and selected value (Gender &#x3D; female).
   * @alias module:model/SearchResult
   * @class
   */

  constructor() {}

  /**
   * Constructs a <code>SearchResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SearchResult} obj Optional instance to populate.
   * @return {module:model/SearchResult} The populated <code>SearchResult</code> instance.
   */
  static constructFromObject(data, obj) {
    if (data) {
      obj = obj || new SearchResult();

      if (data.hasOwnProperty("facet_name")) {
        obj["facet_name"] = ApiClient.convertToType(
          data["facet_name"],
          "String"
        );
      }
      if (data.hasOwnProperty("facet_description")) {
        obj["facet_description"] = ApiClient.convertToType(
          data["facet_description"],
          "String"
        );
      }
      if (data.hasOwnProperty("elasticsearch_field_name")) {
        obj["elasticsearch_field_name"] = ApiClient.convertToType(
          data["elasticsearch_field_name"],
          "String"
        );
      }
      if (data.hasOwnProperty("facet_value")) {
        obj["facet_value"] = ApiClient.convertToType(
          data["facet_value"],
          "String"
        );
      }
    }
    return obj;
  }

  /**
   * The name of the facet.
   * @member {String} facet_name
   */
  facet_name = undefined;
  /**
   * Optional. The description of the facet.
   * @member {String} facet_description
   */
  facet_description = undefined;
  /**
   * The Elasticsearch field name.
   * @member {String} elasticsearch_field_name
   */
  elasticsearch_field_name = undefined;
  /**
   * If this search result represents a facet, facet_value is the empty string. If this search result represents a facet and selected value, facet_value is the selected value.
   * @member {String} facet_value
   */
  facet_value = undefined;
}
