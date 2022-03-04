FROM node:10-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

ENV PARSE_SERVER_URL https://example.com/parse
ENV PARSE_SERVER_APLICATION_ID e0ef0e30-b8e6-11eb-8529-0242ac130003
ENV PARSE_SERVER_MASTER_KEY 32xb
ENV PORT 8089

EXPOSE 8089

CMD [ "node", "app.js" ]