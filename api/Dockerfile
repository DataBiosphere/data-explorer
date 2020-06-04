# This must be run in project root, to pick up dataset_config/.
FROM python:2

WORKDIR /app
COPY api/requirements.txt /app
RUN pip install -r requirements.txt

COPY dataset_config /app/dataset_config
COPY api/data_explorer /app/data_explorer

# Downloading gcloud package
RUN curl https://dl.google.com/dl/cloudsdk/release/google-cloud-sdk.tar.gz > /tmp/google-cloud-sdk.tar.gz

# Installing the package
RUN mkdir -p /usr/local/gcloud \
  && tar -C /usr/local/gcloud -xvf /tmp/google-cloud-sdk.tar.gz \
  && /usr/local/gcloud/google-cloud-sdk/install.sh

# Adding the package path to local
ENV PATH $PATH:/usr/local/gcloud/google-cloud-sdk/bin

COPY startup.sh /app

ENTRYPOINT ["sh", "-x", "startup.sh"]
