"""For convenience, load test data into Elasticsearch index "test_data".
For real datasets, one would use one of the indexers in
https://github.com/DataBiosphere/data-explorer-indexers/, or from somewhere
else. The ElasticSearch index would exist before running the servers in this
repo. For convenience, create a test index so one can easily try out Data
explorer with test data.
Input must be JSON, not CSV. Unlike JSON, CSV values don't have types, so
numbers would be indexed as strings. (And there is no easy way in Python to
detect the type of a string.)
Unfortunately there's no easy way to index a JSON file using curl. (See
https://stackoverflow.com/questions/23798433/json-bulk-import-to-elasticstearch.)
So write a Python script.
"""

import jsmin
import json
import time

from elasticsearch import Elasticsearch
from elasticsearch import helpers
from elasticsearch.exceptions import ConnectionError

INDEX_NAME = 'test_data'
ES_TIMEOUT_SEC = 60


def init_elasticsearch():
    es = Elasticsearch(["elasticsearch:9200"])

    # Wait for Elasticsearch to come up.
    start = time.time()
    for _ in range(0, ES_TIMEOUT_SEC):
        try:
            es.cluster.health(wait_for_status='yellow')
            print('Elasticsearch took %d seconds to come up.' %
                  (time.time() - start))
            break
        except ConnectionError:
            time.sleep(1)
    else:
        raise EnvironmentError("Elasticsearch failed to start.")

    # This script is invoked from docker-compose, so use service name.
    # If running this script directly on host, change to "localhost:9200".
    print('Deleting %s index.' % INDEX_NAME)
    try:
        es.indices.delete(index=INDEX_NAME)
    except Exception as e:
        # Sometimes delete fails even though index exists. Add logging to help
        # debug.
        print('Deleting %s index failed: %s' % (INDEX_NAME, e))
        # Ignore 404: index not found
        index = es.indices.get(index=INDEX_NAME, ignore=404)
        print('es.indices.get(index=%s): %s' % (INDEX_NAME, index))
        pass
    print('Creating %s index.' % INDEX_NAME)
    es.indices.create(index=INDEX_NAME, body={})
    return es


def main():
    es = init_elasticsearch()
    actions = []
    with open('test.json') as f:
        # Remove comments using jsmin, as recommended by JSON creator
        # (https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr).
        records = json.loads(jsmin.jsmin(f.read()))
        for record in records:
            action = {
                '_index': INDEX_NAME,
                # type will go away in future versions of Elasticsearch. Just use any string
                # here.
                '_type': 'type',
                '_source': record,
            }
            actions.append(action)
    helpers.bulk(es, actions)


if __name__ == '__main__':
    main()
