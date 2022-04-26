FROM node:16-buster as build

RUN npm i -g zx

RUN apt-get -y update && apt-get install -y unzip

# these shouldn't really be needed, not sure why they are...
RUN npm i -g aws-cdk
RUN npm i -g ts-node
RUN npm i -g typescript

WORKDIR /src/

ENV AWS_ACCESS_KEY_ID=
ENV AWS_SECRET_ACCESS_KEY=
ENV AWS_ACCOUNT=
ENV AWS_REGION=
ENV APP_ENV=
ENV COLOUR=
ENV MANIFEST_S3_PATH=
ENV DEPLOYED_CONFIG_S3_PATH=
ENV SITE_S3_KEY=artifacts/site-79188d18499ab3fc4e0b0cc83c058f131531d839904cbbc89b2235211147359e.zip
ENV API_S3_KEY=artifacts/site-c75bb55632fb85741bb3857aa8292538be8c7db883b8ccec6d964a6165f04b34.zip

COPY publish/out/deploy.zip ./

RUN unzip -qq ./deploy.zip -d deploy 

WORKDIR /src/deploy

CMD zx deploy.mjs
