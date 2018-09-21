"""Load index from index.json.

Input must be JSON, not CSV. Unlike JSON, CSV values don't have types, so
numbers would be indexed as strings. (And there is no easy way in Python to
detect the type of a string.)
Unfortunately there's no easy way to index a JSON file using curl. (See
https://stackoverflow.com/questions/23798433/json-bulk-import-to-elasticstearch.)
So write a Python script.
"""

import json
import time

from elasticsearch import Elasticsearch
from elasticsearch import helpers
from elasticsearch.exceptions import ConnectionError

INDEX_NAME = '1000_genomes'
INDEX_JSON = 'index.json'
FIELDS_INDEX_NAME = '1000_genomes_fields'
FIELDS_INDEX_JSON = 'fields.json'
MAPPINGS_JSON = 'mappings.json'
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
    with open(MAPPINGS_JSON) as f:
        mappings = json.loads(f.next())
    es.indices.create(index=INDEX_NAME, body=mappings)

    print('Deleting %s index.' % FIELDS_INDEX_NAME)
    try:
        es.indices.delete(index=FIELDS_INDEX_NAME)
    except Exception as e:
        # Sometimes delete fails even though index exists. Add logging to help
        # debug.
        print('Deleting %s index failed: %s' % (FIELDS_INDEX_NAME, e))
        # Ignore 404: index not found
        index = es.indices.get(index=FIELDS_INDEX_NAME, ignore=404)
        print('es.indices.get(index=%s): %s' % (FIELDS_INDEX_NAME, index))
        pass
    print('Creating %s index.' % FIELDS_INDEX_NAME)
    es.indices.create(index=FIELDS_INDEX_NAME)

    return es


def main():
    es = init_elasticsearch()
    actions = []
    with open(INDEX_JSON) as f:
        for line in f:
            # Each line contains a JSON document. See
            # https://github.com/taskrabbit/elasticsearch-dump#dump-format
            record = json.loads(line)
            action = {
                '_id': record['_id'],
                '_index': INDEX_NAME,
                '_type': 'type',
                '_source': record['_source'],
            }
            actions.append(action)

    with open(FIELDS_INDEX_JSON) as f:
        for line in f:
            # Each line contains a JSON document. See
            # https://github.com/taskrabbit/elasticsearch-dump#dump-format
            record = json.loads(line)
            action = {
                '_id': record['_id'],
                '_index': FIELDS_INDEX_NAME,
                '_type': 'type',
                '_source': record['_source'],
            }
            actions.append(action)
    helpers.bulk(es, actions)


if __name__ == '__main__':
    main()
