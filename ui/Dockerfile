FROM node

WORKDIR /ui
COPY package.json package-lock.json /ui/
RUN npm install
RUN npm install react-scripts@1.1.1 -g

CMD ["npm", "start"]
