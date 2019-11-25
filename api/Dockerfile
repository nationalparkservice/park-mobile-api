FROM node:12.11.1-alpine

RUN apk add --no-cache \
  bash \
  git \
  graphicsmagick \
  python2 \
  sqlite \
  curl

RUN curl https://my.usgs.gov/bitbucket/projects/FORT/repos/doirootcert/raw/DOIRootCA.crt -o /etc/ssl/certs/DOIRoot.crt
RUN update-ca-certificates
RUN npm config set cafile /etc/ssl/certs/ca-certificates.crt
RUN npm config set strict-ssl false
RUN git config --global http.sslVerify false

WORKDIR /code
COPY package*.json ./
RUN npm install
