# This must be run in project root, to pick up dataset_config/.
FROM gcr.io/google_appengine/python

# Change the -p argument to use Python 2.7 if desired.
RUN virtualenv /env -p python3.7

# Set virtualenv environment variables. This is equivalent to running
# source /env/bin/activate.
ENV VIRTUAL_ENV /env
ENV PATH /env/bin:$PATH

WORKDIR /app
COPY api/requirements.txt /app
RUN pip install -r requirements.txt

COPY dataset_config /app/dataset_config
COPY api/data_explorer /app/data_explorer

ENTRYPOINT ["gunicorn", "data_explorer.__main__:app"]
