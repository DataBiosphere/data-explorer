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
            if (data.hasOwnProperty('invalid_filter_facets')) {
                obj['invalid_filter_facets'] = ApiClient.convertToType(data['invalid_filter_facets'], ['String']);
            }
            if (data.hasOwnProperty('invalid_extra_facets')) {
                obj['invalid_extra_facets'] = ApiClient.convertToType(data['invalid_extra_facets'], ['String']);
            }
            if (data.hasOwnProperty('sql_query')) {
                obj['sql_query'] = ApiClient.convertToType(data['sql_query'], 'String');
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
    /**
    * Facets that were passed in filter param that don't exist in Elasticsearch index. Example: - Data Explorer url contains   filter=amppd.2019_v1_0101.demographics.sex=female which is valid. User   saves a cohort with this filter - A new version of AMP PD is released. (Data explorer url remains the   same.) The dataset 2019_v1_0101 is replaced by dataset 2019_v2_0401. - User won't be able to open saved cohort in DE;   amppd.2019_v1_0101.demographics.sex is no longer is Elasticsearch   index. invalid_filter_facets will contain   amppd.2019_v1_0101.demographics.sex 
    * @member {Array.<String>} invalid_filter_facets
    */
    invalid_filter_facets = undefined;
    /**
    * Facets that were passed in extraFacets param that don't exist in Elasticsearch index. Example: - Data Explorer url contains   extraFacets=amppd.2019_v1_0101.demographics.sex which is valid. User   saves a cohort with this extra facet - A new version of AMP PD is released. (Data explorer url remains the   same.) The dataset 2019_v1_0101 is replaced by dataset 2019_v2_0401. - User won't be able to open saved cohort in DE;   amppd.2019_v1_0101.demographics.sex is no longer is Elasticsearch   index. invalid_extra_facets will contain   amppd.2019_v1_0101.demographics.sex 
    * @member {Array.<String>} invalid_extra_facets
    */
    invalid_extra_facets = undefined;
    /**
    * SQL query that can be used in BigQuery to get the cohort  (list of participants) of the current filter. 
    * @member {String} sql_query
    */
    sql_query = undefined;








}


