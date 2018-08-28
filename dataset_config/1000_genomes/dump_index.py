import json

from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan

ES_URL = 'http://localhost:9200'
OUTPUT_FILE = './index.json'
INDEX = '1000_genomes'
DOC_TYPE = 'type'

client = Elasticsearch([ES_URL])

fp = open(OUTPUT_FILE, 'w')
for row in scan(client, query={}, index=INDEX, doc_type=DOC_TYPE):
    json.dump(row, fp)
    fp.write('\n')

fp.close()
