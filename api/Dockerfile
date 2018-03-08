FROM python:2

WORKDIR /app
ADD requirements.txt /app
RUN pip install -r requirements.txt

ADD data_explorer /app/data_explorer

ENTRYPOINT ["gunicorn", "-b", ":8390", "data_explorer.__main__:app"]
