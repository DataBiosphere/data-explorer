FROM python:2

RUN pip install elasticsearch

WORKDIR /app
COPY . /app

CMD python indexer.py
