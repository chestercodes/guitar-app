FROM node:16-buster as build

RUN apt-get -y update && apt-get install -y zip

RUN npm install http-server -g

RUN mkdir /out
RUN mkdir /artifact

WORKDIR /src/

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

RUN npm run build

WORKDIR /src/dist/

RUN zip -qr /artifact/site.zip ./* -x *.js.map

CMD ["sh", "-c", "cp /artifact/site.zip /out/"]

FROM build as local

WORKDIR /src/dist/
COPY ./config.json ./config.json
CMD http-server -p 3000