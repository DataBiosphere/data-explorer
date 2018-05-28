# build environment
FROM node:9.6.1 as builder

WORKDIR /ui
ENV PATH /ui/node_modules/.bin:$PATH
COPY package.json /ui/package.json
# src/api contains Swagger-generated data_explorer_service. This is needed by
# "npm install" because package.json has a local dependency on
# data_explorer_service.
COPY src/api /ui/src/api
RUN npm install
RUN npm install react-scripts@1.1.1 -g
COPY . /ui
RUN npm run build:prod

# production environment
FROM nginx
COPY --from=0 /ui/build /ui/build
ADD nginx.prod.conf /etc/nginx/nginx.conf