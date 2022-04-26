FROM node:16-buster as build

RUN apt-get -y update && apt-get install -y zip && apt-get install -y rsync

RUN mkdir /out
RUN mkdir /artifact

WORKDIR /src/

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

RUN npm run build

RUN zip -r -q /artifact/deploy.zip ./*

CMD ["sh", "-c", "cp /artifact/deploy.zip /out/"]
