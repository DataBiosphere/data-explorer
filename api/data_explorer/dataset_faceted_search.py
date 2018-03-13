"""Subclass of FacetedSearch for Data explorer datasets."""

import json

from elasticsearch import Elasticsearch
from elasticsearch_dsl import FacetedSearch
from elasticsearch_dsl import TermsFacet


def _get_index_name():
    """Gets index name from /app/dataset.json."""
    # JSON doesn't support comments
    # (https://plus.google.com/+DouglasCrockfordEsq/posts/RK8qyGVaGSr). Remove
    # comments before parsing.
    with open('/app/dataset.json') as f:
        dataset = json.loads('\n'.join([row for row in f.readlines() if len(row.split('//')) == 1]))
        return dataset['name']


class DatasetFacetedSearch(FacetedSearch):
    index = _get_index_name()
    using = Elasticsearch('elasticsearch:9200')
    # TODO(melissachang): Figure out facets from index.
    facets = {
        'Gender': TermsFacet(field='Gender.keyword'),
        'Region': TermsFacet(field='Region.keyword'),
    }

    def search(self):
        s = super(DatasetFacetedSearch, self).search()
        # Don't execute query; we only care about aggregations. See
        # https://www.elastic.co/guide/en/elasticsearch/reference/current/returning-only-agg-results.html
        return s.params(size=0)
