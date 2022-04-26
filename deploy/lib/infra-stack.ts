import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Config } from './config';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ColourInfra } from './parts/colour-infra';
import { readFileSync } from 'fs';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { appEnvName, blueDistIdName, pipelineBucketName, wwwDomainName } from './switch';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, config: Config, props?: StackProps) {
    super(scope, id, props);

    const blue = new ColourInfra(this, "Blue", config, config.infra.blue, "blue")
    const green = new ColourInfra(this, "Green", config, config.infra.green, "green")

    const blueDistributionId = blue.dist.distributionId
    const blueDistributionArn = `arn:aws:cloudfront::${this.account}:distribution/${blue.dist.distributionId}`

    const wwwDomain = config.isProd ? `www.${config.topLevelDomain}` : `ignore.com`
    if (config.isProd) {
      const hostedZone = HostedZone.fromLookup(this, 'ZoneRef', { domainName: config.topLevelDomain });

      new ARecord(this, 'WwwAliasRecord', {
        recordName: wwwDomain,
        target: RecordTarget.fromAlias(new CloudFrontTarget(green.dist)),
        zone: hostedZone
      });
    }

    const deployCode = readFileSync(config.infra.switchFunctionAssetPath, 'utf8').split("//end")[0]

    const deployCfFunction = new Function(this, 'DeployFunction', {
      code: Code.fromInline(deployCode),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        [blueDistIdName]: blueDistributionId,
        [wwwDomainName]: wwwDomain,
        [appEnvName]: config.appEnv,
        [pipelineBucketName]: config.pipelineBucket,
      },
      functionName: config.infra.switchFunctionName,
      memorySize: 128,
      timeout: Duration.seconds(120)
    });
    deployCfFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "cloudfront:Get*",
        "cloudfront:UpdateDistribution",
      ],
      resources: [blueDistributionArn]
    }))

    const pipelineBucket = Bucket.fromBucketName(this, "PipelineBucketRef", config.pipelineBucket)
    pipelineBucket.grantReadWrite(deployCfFunction, `state/${config.appEnv}/*`)

  }
}
