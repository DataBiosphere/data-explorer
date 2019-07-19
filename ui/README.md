### Debug Vega visualization in [Vega editor](https://vega.github.io/editor)

- In Chrome developer tools, put [breakpoint here](https://github.com/DataBiosphere/data-explorer/blob/efa4897d5ed4e3f01952c36f0ed76a55e5cf776e/ui/src/components/facets/HistogramFacet.js#L252)
- This is step is only for prod (not local) Data Explorers. `vegaSpec` is not
  available from Console so in Sources tab, scroll down to `vegaSpec` variable, right click, click "Store as global variable"
- In Console: `JSON.stringify(vegaSpec)`. Copy the result. (First character
  should be `{`, last character should be `}`)
- Paste at https://vega.github.io/editor/#/
