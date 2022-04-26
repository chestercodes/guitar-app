FROM node:16-buster as base

RUN apt-get -y update && apt-get install -y zip

WORKDIR /src/

COPY src/package.json ./
COPY src/package-lock.json ./

RUN npm install

COPY ./src ./

RUN npx tsc

###############################

FROM base as local
WORKDIR /src/
ENTRYPOINT ["node", "./app/index.js" ]

##############################

FROM base as build

ENV NODE_ENV=production

RUN mkdir /dist
RUN mkdir /out

WORKDIR /src/

RUN rm -rf ./node_modules
RUN npm install --production

RUN zip -qr /dist/api.zip ./*

CMD ["sh", "-c", "cp /dist/api.zip /out/"]
