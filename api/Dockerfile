FROM node:lts-alpine3.14

ADD ./DOIRootCA.crt /etc/ssl/certs/DOIRootCA.crt

RUN cat /etc/ssl/certs/DOIRootCA.crt >> /etc/ssl/certs/ca-certificates.crt

RUN apk add --no-cache \
  bash \
  git \
  graphicsmagick \
  python2 \
  sqlite \
  openssh-client \
  curl

#RUN update-ca-certificates
RUN npm config set cafile /etc/ssl/certs/ca-certificates.crt
RUN npm config set strict-ssl false
RUN git config --global http.sslVerify false

RUN echo '*  *  *  *  *    nc -z localhost 5432 || ssh -o StrictHostKeyChecking=no -4 -N -L 5432:0.0.0.0:5432 $CARTO_SSH_USER@$CARTO_SSH_HOST -q -i $CARTO_SSH_KEY 1>/dev/null &' > /etc/crontabs/root

WORKDIR /code
COPY package*.json ./
RUN npm install
