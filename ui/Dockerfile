# Production Dockerfile
# App Engine requires "Dockerfile", so this can't be named "Dockerfile.prod".

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
RUN npm install react-scripts@2.0.0 -g
COPY . /ui
RUN npm run build

# production environment
FROM nginx
COPY --from=builder /ui/build /ui/build
ADD nginx.conf.prod /etc/nginx/nginx.conf