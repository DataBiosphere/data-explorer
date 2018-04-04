FROM python:2

RUN pip install elasticsearch jsmin

WORKDIR /app
COPY . /app

CMD python indexer.py
