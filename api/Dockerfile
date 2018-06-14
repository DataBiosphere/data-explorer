FROM python:2

WORKDIR /app
ADD requirements.txt /app
RUN pip install -r requirements.txt

COPY dataset_config /app/dataset_config
COPY data_explorer /app/data_explorer

ENTRYPOINT ["gunicorn", "data_explorer.__main__:app"]
