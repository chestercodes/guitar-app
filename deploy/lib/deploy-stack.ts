import { CfnOutput, Duration, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { AuthorizationType, IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Function, Runtime, S3Code } from 'aws-cdk-lib/aws-lambda';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { SiteConfig } from '../shared';
import { Config } from './config';

export class DeployStack extends Stack {
  constructor(scope: Construct, id: string, config: Config, props?: StackProps) {
    super(scope, id, props);

    const colourDomain = `${config.colour}.${config.topLevelDomain}`
    const hostedZone = HostedZone.fromLookup(this, 'Zone', { domainName: config.topLevelDomain });
    const distributionId = Fn.importValue(config.deployingInfraColour.distributionIdOutput)
    const domainName = Fn.importValue(config.deployingInfraColour.distributionDomainOutput)
    const distribution = Distribution.fromDistributionAttributes(this, "CdnRef", {
      distributionId,
      domainName
    })
    const cdnTarget = new CloudFrontTarget(distribution)
    if (config.isProd) {
      new ARecord(this, 'ColourSiteAliasRecord', {
        recordName: colourDomain,
        target: RecordTarget.fromAlias(cdnTarget),
        zone: hostedZone
      });
    }

    const pipelineBucket = Bucket.fromBucketName(this, "PipelineBucketRef", config.pipelineBucket)

    const api = new RestApi(this, 'RestApi', {
      restApiName: config.deploy.restApiName,
      deployOptions: {
        stageName: "api"
      },
      
    })

    
    const code = new S3Code(pipelineBucket, config.deploy.apiFunctionS3Key)
    const apiFunction = new Function(this, 'ApiFunction', {
      code,
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        GUITAR_TABLE: config.data.guitarTableName,
        COLOUR: config.colour,
        APP_ENV: config.appEnv,
      },
      functionName: config.deploy.apiFunctionName,
      memorySize: 128,
      timeout: Duration.seconds(60),
      reservedConcurrentExecutions: 20
    });

    const guitarTable = Table.fromTableName(this, "GuitarTableRef", config.data.guitarTableName)
    guitarTable.grantFullAccess(apiFunction)



    const guitarResource = api.root.addResource('guitar');
    addCorsOptions(guitarResource)

    guitarResource.addMethod('GET', new LambdaIntegration(apiFunction), {
      authorizationType: AuthorizationType.NONE,
    })

    guitarResource.addMethod('PUT', new LambdaIntegration(apiFunction), {
      authorizationType: AuthorizationType.NONE,
    })


    const siteBucketName = Fn.importValue(config.deployingInfraColour.siteBucketNameExportName);
    const siteBucket = Bucket.fromBucketName(this, "SiteBucketRef", siteBucketName)

    new BucketDeployment(this, 'DeployWithColourInvalidation', {
      sources: [Source.bucket(pipelineBucket, config.deploy.siteS3Key)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: [`/*`],
    })

    const siteConfig: SiteConfig = {
      apiBaseUrl: api.url
    }

    new CfnOutput(this, "SiteConfigOutputName", {
      value: JSON.stringify(siteConfig),
      exportName: config.deploy.siteConfigOutputName,
    });

    new CfnOutput(this, "SiteBucketOutputName", {
      value: siteBucketName,
      exportName: config.deploy.siteBucketOutputName,
    });

  }
}


export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}
