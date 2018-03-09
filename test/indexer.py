"""For convenience, load test data into Elasticsearch index "test".

Unfortunately there's no easy way to index a JSON file using curl. (See
https://stackoverflow.com/questions/23798433/json-bulk-import-to-elasticstearch.)
So write a Python script.
"""

import csv
import time

from elasticsearch import Elasticsearch
from elasticsearch import helpers


INDEX_NAME = 'test'


def init_elasticsearch():
  # Wait for Elasticsearch to come up.
  # I had trouble getting wait_for_status to work, so just use sleep. See
  # https://discuss.elastic.co/t/cant-get-python-client-wait-for-status-to-work/123163
  time.sleep(10)

  # This script is invoked from docker-compose, so use service name.
  # If running this script directly on host, change to "localhost:9200".
  es = Elasticsearch(["elasticsearch:9200"])
  print('Deleting and recreating %s index.' % INDEX_NAME)
  try:
    es.indices.delete(index=INDEX_NAME)
  except Exception:
    pass
  es.indices.create(index=INDEX_NAME, body={})
  return es


def main():
  es = init_elasticsearch()
  with open('test.csv') as f:
    reader = csv.DictReader(f)
    helpers.bulk(es, reader, index=INDEX_NAME, doc_type='type')


if __name__ == '__main__':
  main()
