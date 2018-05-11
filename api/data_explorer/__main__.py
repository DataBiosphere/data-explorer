#!/usr/bin/env python

import argparse
import logging
import os

import connexion
from flask_cors import CORS

from .encoder import JSONEncoder
import dataset_faceted_search


def split_env_flag(name):
    """Converts a comma-delimited env var into a list.

    Args:
      name: (str) the name of the environment variable

    Returns:
      (list<str>) the elements of the comma-delimited list, or an empty list if
        the env variable is empty or unset
    """
    if name not in os.environ or os.environ[name] is '':
        return []
    return os.environ[name].split(',')


# gunicorn flags are passed via env variables, so we use these as the default
# values. These arguments will rarely be specified as flags directly, aside from
# occasional use during local debugging.
parser = argparse.ArgumentParser()
# ALLOW_ORIGINS is only set during AE deployment, not during local development.
parser.add_argument(
    '--allow_origins',
    type=str,
    nargs='+',
    help='Origins to allow for CORS; defaults to CORS disabled',
    default=split_env_flag('ALLOW_ORIGINS'))
parser.add_argument(
    '--path_prefix',
    type=str,
    help='Path prefix, e.g. /api, to serve from',
    default=os.environ.get('PATH_PREFIX'))
parser.add_argument(
    '--elasticsearch_url',
    type=str,
    help='Elasticsearch url, e.g. elasticsearch:9200',
    default=os.environ.get('ELASTICSEARCH_URL'))

if __name__ == '__main__':
    parser.add_argument(
        '--port',
        type=int,
        default=8390,
        help='The port on which to serve HTTP requests')
    args = parser.parse_args()
else:
    # Allow unknown args if we aren't the main program, these include flags to
    # gunicorn.
    args, _ = parser.parse_known_args()

app = connexion.App(__name__, specification_dir='./swagger/', swagger_ui=True)
app.app.config['ELASTICSEARCH_URL'] = args.elasticsearch_url
if args.allow_origins:
    prefix = args.path_prefix or ''
    CORS(
        app.app,
        resources={
            prefix + '/*': {
                'origins': args.allow_origins,
            },
        })

# Log to stderr.
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
app.app.logger.addHandler(handler)
app.app.logger.setLevel(logging.INFO)

app.app.json_encoder = JSONEncoder
app.add_api('swagger.yaml', base_path=args.path_prefix)


@app.app.before_first_request
def init():
    # Read config files. Just do this once; don't need to read files on every
    # request.
    app.app.config['INDEX_NAME'] = dataset_faceted_search.get_index_name()
    # get_facets() reads from current_app.config. If we move this outside of
    # init(), Flask complains that we're working outside of application
    # context. @app.app.before_first_request guarantees that app context has
    # been set up.
    app.app.config[
        'ELASTICSEARCH_FACETS'] = dataset_faceted_search.get_facets()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=args.port)
