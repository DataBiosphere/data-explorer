# coding: utf-8

import sys
from setuptools import setup, find_packages

NAME = "data_explorer"
VERSION = "1.0.0"

# To install the library, run the following
#
# python setup.py install
#
# prerequisite: setuptools
# http://pypi.python.org/pypi/setuptools

REQUIRES = ["connexion"]

setup(
    name=NAME,
    version=VERSION,
    description="Data Explorer Service",
    author_email="",
    url="",
    keywords=["Swagger", "Data Explorer Service"],
    install_requires=REQUIRES,
    packages=find_packages(),
    package_data={'': ['swagger/swagger.yaml']},
    include_package_data=True,
    entry_points={
        'console_scripts': ['data_explorer=data_explorer.__main__:main']
    },
    long_description="""\
    API Service that reads from Elasticsearch.
    """)
