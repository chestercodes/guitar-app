FROM node:16-buster as build

RUN npm i -g zx
RUN apt-get -y update && apt-get install -y awscli

ENV BRANCH_NAME=
ENV MANIFEST_S3_BUCKET=guitarapp-pipeline
ENV AWS_ACCESS_KEY_ID=
ENV AWS_SECRET_ACCESS_KEY=
ENV AWS_ACCOUNT=
ENV AWS_REGION=

WORKDIR /work

COPY out/ ./out/
COPY Publish.mjs ./

CMD zx Publish.mjs
