FROM python:2

WORKDIR /app
ADD api/requirements.txt /app
RUN pip install -r requirements.txt

ENV PATH_PREFIX /api
# Avoid writing .pyc files back to the volume. Files generated this way
# have restricted permissions set which cause errors on subsequent docker
# builds.
ENV PYTHONDONTWRITEBYTECODE 1

# This Dockerfile must be run from repo root - not api/ - since config is in
# repo root.
COPY config/dataset.json /app/
COPY api/data_explorer /app/data_explorer

# --reload will restart server after code change
# DO NOT SUBMIT
#ENTRYPOINT ["gunicorn", "-b", ":8390", "--reload", "data_explorer.__main__:app"]
ENTRYPOINT ["gunicorn", "-b", ":8390", "--reload", "-t", "360000", "data_explorer.__main__:app"]
