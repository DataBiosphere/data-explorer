import json
import requests
from StringIO import StringIO

from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan

ES_URL = 'http://localhost:9200'
OUTPUT_INDEX_FILE = 'dataset_config/1000_genomes/index.json'
OUTPUT_MAPPINGS_FILE = 'dataset_config/1000_genomes/mappings.json'
INDEX = '1000_genomes'
DOC_TYPE = 'type'
STRIP_INTERNAL_MAPPING = '"fields": {"keyword": {"ignore_above": 256, "type": "keyword"}}, '

client = Elasticsearch([ES_URL])

index_file = open(OUTPUT_INDEX_FILE, 'w')
for row in scan(client, query={}, index=INDEX, doc_type=DOC_TYPE):
    json.dump(row, index_file)
    index_file.write('\n')

index_file.close()

mappings_file = open(OUTPUT_MAPPINGS_FILE, 'w')
mappings = requests.get('%s/%s/_mapping/type' % (ES_URL, INDEX)).json()
io = StringIO()
json.dump(mappings[INDEX], io)
json_str = io.getvalue().replace(STRIP_INTERNAL_MAPPING, '')
mappings_file.write(json_str)
mappings_file.close()
