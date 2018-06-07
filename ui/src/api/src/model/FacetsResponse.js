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
import Facet from './Facet';





/**
* The FacetsResponse model module.
* @module model/FacetsResponse
* @version 0.0.1
*/
export default class FacetsResponse {
    /**
    * Constructs a new <code>FacetsResponse</code>.
    * Results from a faceted search.
    * @alias module:model/FacetsResponse
    * @class
    */

    constructor() {
        

        
        

        

        
    }

    /**
    * Constructs a <code>FacetsResponse</code> from a plain JavaScript object, optionally creating a new instance.
    * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
    * @param {Object} data The plain JavaScript object bearing properties of interest.
    * @param {module:model/FacetsResponse} obj Optional instance to populate.
    * @return {module:model/FacetsResponse} The populated <code>FacetsResponse</code> instance.
    */
    static constructFromObject(data, obj) {
        if (data) {
            obj = obj || new FacetsResponse();

            
            
            

            if (data.hasOwnProperty('facets')) {
                obj['facets'] = ApiClient.convertToType(data['facets'], [Facet]);
            }
            if (data.hasOwnProperty('count')) {
                obj['count'] = ApiClient.convertToType(data['count'], 'Number');
            }
        }
        return obj;
    }

    /**
    * @member {Array.<module:model/Facet>} facets
    */
    facets = undefined;
    /**
    * Number of entities represented by current facet selection. For example, this could be 40, representing 40 people. 
    * @member {Number} count
    */
    count = undefined;








}


