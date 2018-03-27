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
            facetsResponse: props.facetsResponse
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
                this.setState({facetsResponse: data});
            }
        }.bind(this);
        this.updateFacets = this.updateFacets.bind(this);
    }

    render() {
        const facetsList = this.state.facetsResponse.facets.map((facet) =>
            <GridTile key={facet.name}>
                <FacetCard
                    facet={facet}
                    count={this.state.facetsResponse.count}
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
        if (this.searchFilters.get(facetName) === undefined && isSelected) {
            this.searchFilters.set(facetName, [facetValue]);
        } else if (this.searchFilters.get(facetName) !== undefined) {
            if (isSelected && !this.searchFilters.get(facetName).includes(facetValue)) {
                // this.searchFilters.set(facetName, this.searchFilters.get(facetName).push(facetValue));
                this.searchFilters.get(facetName).push(facetValue);
            } else if (!isSelected) {
                this.searchFilters.set(facetName, this.removeFacet(this.searchFilters.get(facetName), facetValue));
            }
        }
        this.api.facetsGet(this.cleanFilterList(this.searchFilters), this.callback);
    }

    removeFacet(valueList, facetValue) {
        for (let i = valueList.length-1; i >= 0; i--) {
            if (valueList[i] === facetValue) {
                valueList.splice(i, 1);
                break;
            }
        }
        return valueList;
    }

    cleanFilterList(searchFilters) {
        let cleanFilters = {};
        searchFilters.forEach((value, key) => {
            if (value.length !== 0) {
                cleanFilters[key] = value;
            }
        });
        return cleanFilters;
    }
}

export default FacetsGrid;
