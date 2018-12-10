import React, { Component } from "react";
import * as vega from 'vega';

const styles = {}

// TODO(bryancrampton): Make this a static JSON file?
const baseSpec = {
	"$schema": "https://vega.github.io/schema/vega/v3.0.json",
	"width": 400,
	"height": 200,
	"padding": 5,
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

class FacetHistogram extends Component {
  	constructor(props) {
    	super(props);

    	this.facetValues = this.props.facet.values;
    	// Make a copy of the base histogram spec and populate it
    	// with data.
    	this.spec = Object.assign({
    		"data": [{
    			"name": "table",
    			"values": this.facetValues.map(facetvalue => ({
					"facet_value": facetvalue.name,
    				"count": facetvalue.count,
				}))
    		}]
    	}, baseSpec)
    	// Set the proper title on the axis.
    	this.spec["axes"][0]["title"] = this.props.facet.name
	}

	componentDidMount() {
  		const parsed = vega.parse(this.spec)
  		const view = new vega.View(parsed).initialize(this.element).hover().run();
  		view.addEventListener('click', this.handleFacetValueClick)
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

  	handleFacetValueClick(event, item) {
  		// TODO(bryancrampton): Handle clicking facet value.
  		console.log(item.datum["facet_value"])
  	}
}

export default FacetHistogram;