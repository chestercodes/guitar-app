FROM mcr.microsoft.com/playwright:v1.21.0-focal as build

RUN apt-get -y update && apt-get install -y zip

RUN mkdir /out
RUN mkdir /artifact

WORKDIR /src/

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

RUN npm run build

RUN zip -qr /artifact/tests.zip ./*

CMD ["sh", "-c", "cp /artifact/tests.zip /out/"]
