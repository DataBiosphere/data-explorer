The public [1000 Genomes](http://www.internationalgenome.org/about) dataset.

For a live Data Explorer of this dataset, see https://test-data-explorer.appspot.com

For convenience, this repo reads the index from a JSON file. This way, one can
quickly try out Data Explorer without having to set up and run any
of the [data explorer indexers](https://github.com/DataBiosphere/data-explorer-indexers).

### Update index JSON

Ensure the elastic search index is already running at `http://localhost:9200`.

```
virtualenv ~/virtualenv/elasticsearch
source ~/virtualenv/elasticsearch/bin/activate
pip install elasticsearch requests
python util/dump_index.py \ 
 --us_url='http://some-path' \
 --dataset='some_other_dataset' \
 --output_dir='dataset_config/some_other_dataset'
deactivate
```
