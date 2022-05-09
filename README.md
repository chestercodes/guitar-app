# guitar-app
Example app with AWS Cloudfront, S3, Lambda, CDK, API Gateway and Github actions based CI/CD

This repository contains code that is deployed by the [pipeline repository](https://github.com/chestercodes/guitar-app-pipeline). The project is built by github actions and adds the artifacts and manifest to the pipeline S3 bucket which triggers the deployment pipeline. The artifacts produced are:

- site - website that displays the guitars
- api - lambda function that is used for the backend
- tests - a couple of basic E2E tests to smoke test the deployment
- deploy - contains the deployment project which is passed the artifacts keys as environment variables and then run

The app is deployed to two Cloudfront distribution and S3 bucket pairs, in a Green/Blue deployment strategy.
More information about this can be seen in [this blog post](https://chester.codes/cloudfront-green-blue).
The data layer, in the form of a DynamoDB table is shared between the two environments which needs to be considered when deploying.

![AppDiagram](App.png)

## Getting started

### Code to change

For the code to run in the pipeline need to do a find and replace on the string `guitarapp` and change it to the value that is set in the pipeline repo.

When the app is deploying correctly, will obviously need to change the `api`. `site` and `tests` to make the app.


### Secrets

Once the pipeline repository is bootstrapped need to add the following secrets to the github actions secrets repo:

 name | value |
 ---- | ----- |
 PIPELINE_AWS_ACCOUNT | AWS account number, currently all code is designed to deploy to same account. |
 BUILD_ACCESS_KEY_ID | Create credential from bootstrapped build user. |
 BUILD_SECRET_ACCESS_KEY | Create credential from bootstrapped build user. |
 
