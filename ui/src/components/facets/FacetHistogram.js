import React, { Component } from "react";
import * as vega from 'vega';

const styles = {}

// TODO(bryancrampton): Make this a static JSON file?
class FacetHistogram extends Component {
  	constructor(props) {
    	super(props);

    	this.facetValues = this.props.facet.values;
    	this.spec = {
			"$schema": "https://vega.github.io/schema/vega/v3.0.json",
			"width": 400,
			"height": 200,
			"padding": 5,
			"data": [{
		      	"name": "table",
		      	"values": this.facetValues.map(facetvalue => ({
    				"facet_value": facetvalue.name,
    				"count": facetvalue.count,
    			}))
		    }],
			"signals": [
			  {
			    "name": "tooltip",
			    "value": {},
			    "on": [
			      {"events": "rect:mouseover", "update": "datum"},
			      {"events": "rect:mouseout", "update": "{}"}
			    ]
			  }
			],
			"scales": [
			  {
			    "name": "xscale",
			    "type": "band",
			    "domain": {"data": "table", "field": "facet_value"},
			    "range": "width"
			  },
			  {
			    "name": "yscale",
			    "domain": {"data": "table", "field": "count"},
			    "nice": true,
			    "range": "height"
			  }
			],
			"axes": [
			  {
			  	"orient": "bottom", 
			  	"scale": "xscale", 
			  	"labelAngle": "90", 
			  	"labelAlign": "left",
			  	"labelFontSize": 12,
			  	"title": this.props.facet.name,
			  },
			  {
			  	"orient": "left", 
			  	"scale": "yscale",
			  	"labelFontSize": 12,
			  }
			],
			"marks": [
			  {
			    "type": "rect",
			    "from": {"data": "table"},
			    "encode": {
			      "enter": {
			        "x": {"scale": "xscale", "field": "facet_value", "offset": 1},
			        "width": {"scale": "xscale", "band": 1, "offset": -1},
			        "y": {"scale": "yscale", "field": "count"},
			        "y2": {"scale": "yscale", "value": 0}
			      },
			      "update": {"fill": {"value": "steelblue"}},
			      "hover": {"fill": {"value": "red"}}
			    }
			  },
			  {
			    "type": "text",
			    "encode": {
			      "enter": {
			        "align": {"value": "center"},
			        "baseline": {"value": "bottom"},
			        "fill": {"value": "#333"}
			      },
			      "update": {
			        "x": {"scale": "xscale", "signal": "tooltip.facet_value", "band": 0.5},
			        "y": {"scale": "yscale", "signal": "tooltip.count", "offset": -2},
			        "text": {"signal": "tooltip.count"},
			        "fillOpacity": [
			          {"test": "datum === tooltip", "value": 0},
			          {"value": 1}
			        ]
			      }
			    }
			  }
			],
			"config": {}
		}
    	
    	// this.onClick = this.onClick.bind(this);
    	// this.isDimmed = this.isDimmed.bind(this);
	}

	componentDidMount() {
  		const parsed = vega.parse(this.spec)
  		const view = new vega.View(parsed).initialize(this.element).hover();
	}

	render() {
		return (
      		// Create the container Vega draws inside
      		<div
        	 ref={(c) => { this.element = c; }}
        	 className={this.props.className}
        	 style={this.props.style}
      		/>
    	);
  	}

}

export default FacetHistogram;