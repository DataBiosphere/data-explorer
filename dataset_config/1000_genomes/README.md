The public [1000 Genomes](http://www.internationalgenome.org/about) dataset.

For a live Data Explorer of this dataset, see https://test-data-explorer.appspot.com

See [here](https://github.com/DataBiosphere/data-explorer-indexers/blob/master/dataset_config/1000_genomes)
for the other dataset config files.
(`ui.json` is here because it is only used by this repo.)

For convenience, this repo reads the index from a JSON file. This way, one can
quickly try out Data Explorer without having to set up and run any
of the [data explorer indexers](https://github.com/DataBiosphere/data-explorer-indexers).

### Update index JSON
Ensure the elastic search index is already running at `http://localhost:9200`.
```
pip install elasticsearch
python dataset_config/1000_genomes/dump_index.py
```
