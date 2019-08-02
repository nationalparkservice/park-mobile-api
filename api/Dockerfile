FROM node:12.7.0-alpine

RUN apk add --no-cache \
  bash \
  git \
  python3 \ 
  sqlite

RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /code
COPY package*.json ./
RUN npm install
