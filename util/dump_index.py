"""Dump the current elasticsearch index to a JSON file,

This should be used to re-create the cached 1000 genomes
example index if the indexer changes. It dumps the main
index and its mappings, as well as the '_fields' index. 
This tool can also be used to dump any other index.

- Ensure the elastic search index is already running at `http://localhost:9200`.
- Run:

virtualenv ~/virtualenv/dump_index
source ~/virtualenv/dump_index/bin/activate
pip install elasticsearch requests
python util/dump_index.py
deactivate
"""
import argparse
import json
import os
import requests

from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan

DOC_TYPE = 'type'


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--es_url',
                        default='http://localhost:9200',
                        required=False)
    parser.add_argument('--dataset', default='1000_genomes', required=False)
    parser.add_argument('--output_dir',
                        default='dataset_config/1000_genomes',
                        required=False)
    return parser.parse_args()


def main():
    args = parse_args()
    client = Elasticsearch([args.es_url])
    index = args.dataset
    fields_index = '%s_fields' % args.dataset
    output_index_file = os.path.join(args.output_dir, 'index.json')
    output_fields_file = os.path.join(args.output_dir, 'fields.json')
    output_mappings_file = os.path.join(args.output_dir, 'mappings.json')

    print 'Dumping index: %s' % index
    index_file = open(output_index_file, 'w')
    for row in scan(client, query={}, index=index, doc_type=DOC_TYPE):
        json.dump(row, index_file)
        index_file.write('\n')
    index_file.close()

    fields_index_file = open(output_fields_file, 'w')
    print 'Dumping index: %s' % fields_index
    for row in scan(client, query={}, index=fields_index, doc_type=DOC_TYPE):
        print(row)
        json.dump(row, fields_index_file)
        fields_index_file.write('\n')
    fields_index_file.close()

    print 'Dump index mappings: %s' % index
    mappings_file = open(output_mappings_file, 'w')
    mappings = requests.get('%s/%s/_mapping/type' %
                            (args.es_url, index)).json()
    json.dump(mappings[index], mappings_file)
    mappings_file.close()


if __name__ == '__main__':
    main()
