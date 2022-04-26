#!/usr/bin/env bash
printf "Configuring localstack components..."

# https://betterprogramming.pub/dont-be-intimidated-learn-how-to-run-aws-on-your-local-machine-with-localstack-2f3448462254

readonly LOCALSTACK_DYNAMODB_URL=http://localstack:4566

sleep 1;

set -x

aws configure set aws_access_key_id foo
aws configure set aws_secret_access_key bar
echo "[default]" > ~/.aws/config
echo "region = us-east-1" >> ~/.aws/config
echo "output = json" >> ~/.aws/config

aws dynamodb create-table --cli-input-json file:///docker-entrypoint-initaws.d/guitar-table.json --endpoint-url $LOCALSTACK_DYNAMODB_URL 

aws dynamodb batch-write-item --request-items file:///docker-entrypoint-initaws.d/initial-data.json --endpoint-url $LOCALSTACK_DYNAMODB_URL 

set +x

printf "Localstack dashboard : http://localhost:8080/#!/infra"
