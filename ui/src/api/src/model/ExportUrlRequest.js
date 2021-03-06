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
* The ExportUrlRequest model module.
* @module model/ExportUrlRequest
* @version 0.0.1
*/
export default class ExportUrlRequest {
    /**
    * Constructs a <code>ExportUrlRequest</code> from a plain JavaScript object, optionally creating a new instance.
    * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
    * @param {Object} data The plain JavaScript object bearing properties of interest.
    * @param {module:model/ExportUrlRequest} obj Optional instance to populate.
    * @return {module:model/ExportUrlRequest} The populated <code>ExportUrlRequest</code> instance.
    */
    static constructFromObject(data, obj) {
        if (data) {
            obj = obj || new ExportUrlRequest();

            
            
            

            if (data.hasOwnProperty('cohortName')) {
                obj['cohortName'] = ApiClient.convertToType(data['cohortName'], 'String');
            }
            if (data.hasOwnProperty('filter')) {
                obj['filter'] = ApiClient.convertToType(data['filter'], ['String']);
            }
            if (data.hasOwnProperty('dataExplorerUrl')) {
                obj['dataExplorerUrl'] = ApiClient.convertToType(data['dataExplorerUrl'], 'String');
            }
            if (data.hasOwnProperty('sqlQuery')) {
                obj['sqlQuery'] = ApiClient.convertToType(data['sqlQuery'], 'String');
            }
        }
        return obj;
    }

    /**
    * @member {String} cohortName
    */
    cohortName = undefined;
    /**
    * @member {Array.<String>} filter
    */
    filter = undefined;
    /**
    * @member {String} dataExplorerUrl
    */
    dataExplorerUrl = undefined;
    /**
    * @member {String} sqlQuery
    */
    sqlQuery = undefined;








}


