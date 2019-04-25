/**
 * Converts filter array to map.
 * esfn = es field name
 * In: ["Gender esfn%3Dmale", "Gender esfn%3Dfemale", "Population esfn%3DAmerican"]
 * Out: {"Gender esfn" => ["male", "female"], "Population esfn" => ["American"]}
 */
const filterArrayToMap = function(filterArray) {
  let filterMap = new Map();
  filterArray.forEach(function(pair) {
    pair = pair.split(encodeURIComponent("="));
    if (filterMap.has(pair[0])) {
      let arr = filterMap.get(pair[0]);
      arr.push(pair[1]);
      filterMap.set(pair[0], arr);
    } else {
      filterMap.set(pair[0], [pair[1]]);
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
