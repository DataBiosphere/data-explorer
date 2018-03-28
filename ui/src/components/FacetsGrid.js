import './FacetsGrid.css';
import FacetCard from "./FacetCard";
import ApiClient from "../api/src/ApiClient";
import FacetsApi from "../api/src/api/FacetsApi";

import React, { Component } from 'react';
import {GridList, GridTile} from "material-ui/GridList";

class FacetsGrid extends Component {

    constructor(props) {
        super(props);
        this.state = {
            totalCount: props.facetsResponse.count,
            facets: props.facetsResponse.facets
        };
        this.searchFilters = new Map();
        let apiClient = new ApiClient();
        apiClient.basePath = '/api';
        this.api = new FacetsApi(apiClient);
        this.callback = function(error, data) {
            if (error) {
                console.error(error);
                // TODO(alanhwang): Redirect to an error page
            } else {
                this.setState({
                  totalCount: data.count,
                  facets: data.facets
                });
            }
        }.bind(this);
        this.updateFacets = this.updateFacets.bind(this);
    }

    render() {
        const facetsList = this.state.facets.map((facet) =>
            <GridTile key={facet.name}>
                <FacetCard
                    facet={facet}
                    count={this.state.totalCount}
                    updateFacets={this.updateFacets}
                    className='facetCard'/>
            </GridTile>
        );
        return (
            <GridList
                className="gridList"
                cols={3}
                cellHeight="auto"
                padding={1}
            >
                {facetsList}
            </GridList>
        );
    }

    /**
     * Updates the selection for a single facet value and refreshes the facets data from the server.
     * @param facetName string containing the name of the facet corresponding to this value
     * @param facetValue string containing the name of this facet value
     * @param isSelected bool indicating whether this facetValue should be added to or removed from the query
     * */
    updateFacets(facetName, facetValue, isSelected) {
        let currentFacetValues = this.searchFilters.get(facetName);
        if (isSelected) {
            // Add facetValue to the list of filters for facetName
            if (currentFacetValues === undefined) {
                this.searchFilters.set(facetName, [facetValue]);
            } else {
                currentFacetValues.push(facetValue);
            }
        } else if (this.searchFilters.get(facetName) !== undefined) {
            // Remove facetValue from the list of filters for facetName
            this.searchFilters.set(facetName, this.removeFacet(currentFacetValues, facetValue));
        }
        this.api.facetsGet({filter: this.serializeFilters(this.searchFilters)}, this.callback);
    }

    removeFacet(valueList, facetValue) {
        let newValueList = [];
        for (let i = 0; i < valueList.length; i++) {
            if (valueList[i] !== facetValue) {
                newValueList.push(valueList[i])
            }
        }
        return newValueList;
    }

    serializeFilters(searchFilters) {
        let filterStr = [];
        searchFilters.forEach((values, key) => {
            if (values.length > 0) {
                for (let value of values) {
                    filterStr.push(key + "=" + value);
                }
            }
        });
        return filterStr.join(',');
    }
}

export default FacetsGrid;
