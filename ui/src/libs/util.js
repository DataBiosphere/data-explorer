/**
 * Converts filter array to map.
 * esfn = es field name
 * In: ["Gender esfn%3Dmale", "Gender esfn%3Dfemale", "Population esfn%3DAmerican"]
 * Out: {"Gender esfn" => ["male", "female"], "Population esfn" => ["American"]}
 */
const filterArrayToMap = function(filterArray, invalidFilterFacets) {
  let filterMap = new Map();
  filterArray.forEach(function(pair) {
    pair = pair.split(encodeURIComponent("="));
    const esFieldName = pair[0];
    const facetValue = pair[1];

    if (invalidFilterFacets && invalidFilterFacets.includes(esFieldName)) {
      return;
    }

    if (filterMap.has(esFieldName)) {
      let arr = filterMap.get(esFieldName);
      arr.push(facetValue);
      filterMap.set(esFieldName, arr);
    } else {
      filterMap.set(esFieldName, [facetValue]);
    }
  });
  return filterMap;
};

/**
 * Converts filter map to array. Backend only understands array, not map.
 * esfn = es field name
 * In: {"Gender esfn" => ["male", "female"], "Population esfn" => ["American"]}
 * Out: ["Gender esfn=male", "Gender esfn=female", "Population esfn=American"]
 */
const filterMapToArray = function(filterMap) {
  let filterArray = [];
  filterMap.forEach((values, key) => {
    // Scenario where there are no values for a key: A single value is
    // checked for a facet. The value is unchecked. The facet name will
    // still be a key in filterMap, but there will be no values.
    if (values.length > 0) {
      for (let value of values) {
        filterArray.push(key + "=" + value);
      }
    }
  });
  return filterArray;
};

export { filterArrayToMap, filterMapToArray };
