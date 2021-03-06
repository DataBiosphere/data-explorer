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


import ApiClient from '../ApiClient';





/**
* The DatasetResponse model module.
* @module model/DatasetResponse
* @version 0.0.1
*/
export default class DatasetResponse {
    /**
    * Constructs a <code>DatasetResponse</code> from a plain JavaScript object, optionally creating a new instance.
    * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
    * @param {Object} data The plain JavaScript object bearing properties of interest.
    * @param {module:model/DatasetResponse} obj Optional instance to populate.
    * @return {module:model/DatasetResponse} The populated <code>DatasetResponse</code> instance.
    */
    static constructFromObject(data, obj) {
        if (data) {
            obj = obj || new DatasetResponse();

            
            
            

            if (data.hasOwnProperty('name')) {
                obj['name'] = ApiClient.convertToType(data['name'], 'String');
            }
            if (data.hasOwnProperty('search_placeholder_text')) {
                obj['search_placeholder_text'] = ApiClient.convertToType(data['search_placeholder_text'], 'String');
            }
            if (data.hasOwnProperty('time_series_unit')) {
                obj['time_series_unit'] = ApiClient.convertToType(data['time_series_unit'], 'String');
            }
        }
        return obj;
    }

    /**
    * @member {String} name
    */
    name = undefined;
    /**
    * Optional. What to show in the search box by default
    * @member {String} search_placeholder_text
    */
    search_placeholder_text = undefined;
    /**
    * If time_series_column in bigquery.json is set, this must be set. This is used to label the time axis -- eg Month or Year. 
    * @member {String} time_series_unit
    */
    time_series_unit = undefined;








}


