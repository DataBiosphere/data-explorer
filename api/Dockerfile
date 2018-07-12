# This must be run in project root, to pick up dataset_config/.
FROM python:2

WORKDIR /app
COPY api/requirements.txt /app
RUN pip install -r requirements.txt

COPY dataset_config /app/dataset_config
COPY api/data_explorer /app/data_explorer

ENTRYPOINT ["gunicorn", "data_explorer.__main__:app"]
