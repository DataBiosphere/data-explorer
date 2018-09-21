import json
import requests

from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan

ES_URL = 'http://localhost:9200'
OUTPUT_INDEX_FILE = 'dataset_config/1000_genomes/index.json'
OUTPUT_FIELDS_INDEX_FILE = 'dataset_config/1000_genomes/fields.json'
OUTPUT_MAPPINGS_FILE = 'dataset_config/1000_genomes/mappings.json'
INDEX = '1000_genomes'
FIELDS_INDEX = '1000_genomes_fields'
DOC_TYPE = 'type'

client = Elasticsearch([ES_URL])

print('Dumping index')

index_file = open(OUTPUT_INDEX_FILE, 'w')
for row in scan(client, query={}, index=INDEX, doc_type=DOC_TYPE):
    json.dump(row, index_file)
    index_file.write('\n')

index_file.close()

fields_index_file = open(OUTPUT_FIELDS_INDEX_FILE, 'w')
print("Dumping fields index")
for row in scan(client, query={}, index=FIELDS_INDEX, doc_type=DOC_TYPE):
    print(row)
    json.dump(row, fields_index_file)
    fields_index_file.write('\n')

fields_index_file.close()

mappings_file = open(OUTPUT_MAPPINGS_FILE, 'w')
mappings = requests.get('%s/%s/_mapping/type' % (ES_URL, INDEX)).json()
json.dump(mappings[INDEX], mappings_file)
mappings_file.close()
