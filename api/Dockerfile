FROM python:2

WORKDIR /app
ADD requirements.txt /app
RUN pip install -r requirements.txt

COPY data_explorer /app/data_explorer

# --reload will restart server after code change
ENTRYPOINT ["gunicorn", "-b", ":8390", "--reload", "data_explorer.__main__:app"]
