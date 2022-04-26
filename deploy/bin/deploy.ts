#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';
import { DataStack } from '../lib/data-stack';
import { DeployStack } from '../lib/deploy-stack';
import { appName, getConfig } from '../lib/config';
import { CertStack } from '../lib/cert-stack';

const config = getConfig()
//console.log(JSON.stringify(config, null, 2))

const app = new cdk.App();

new CertStack(app, `${appName}-cert`, config, {
  env: { account: config.awsAccount, region: config.awsRegion },
});

new DataStack(app, `${appName}-${config.appEnv}-data`, config, {
  env: { account: config.awsAccount, region: config.awsRegion },
});

new InfraStack(app, `${appName}-${config.appEnv}-infra`, config, {
  env: { account: config.awsAccount, region: config.awsRegion },
});

new DeployStack(app, `${appName}-${config.appEnv}-deploy-${config.colour}`, config, {
  env: { account: config.awsAccount, region: config.awsRegion },
});