import { CfnOutput, Fn, PhysicalName, RemovalPolicy } from 'aws-cdk-lib';
import { Distribution, ResponseHeadersPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { appName, Config, topLevelDomain } from '../config';
import { InfraColourConfig } from '../config';

export class ColourInfra extends Construct {
  dist: Distribution

  constructor(scope: Construct, id: string, config: Config, colourConfig: InfraColourConfig, colour: string) {
    super(scope, id);

    const siteBucket = new Bucket(this, "SiteBucket", {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      bucketName: PhysicalName.GENERATE_IF_NEEDED,
    });

    new CfnOutput(this, "SiteBucketNameOutput", {
      value: siteBucket.bucketName,
      exportName: colourConfig.siteBucketNameExportName,
    });

    const certificateArn = Fn.importValue(config.certificateArnOutput);
    const certificate = Certificate.fromCertificateArn(this, "CertRef", certificateArn)
    
    const responseHeadersPolicyName = `add${colour}header${config.appEnv}`
    const addColourHeaders = new ResponseHeadersPolicy(this, "AddColourHeaders", {
      responseHeadersPolicyName,
      comment: `Add ${colour} header`,
      customHeadersBehavior: {
        customHeaders: [
          {
            header: "X-Colour",
            value: colour,
            override: true
          }
        ]
      }
    })
    
    const distribution = new Distribution(this, "SiteDistribution",
      {
        comment: `${appName} - ${config.appEnv} - ${colour}`,
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          }
        ],
        domainNames: colourConfig.domainNames,
        certificate,
        defaultBehavior: {
          origin: new S3Origin(siteBucket, {}),
          responseHeadersPolicy: {
            responseHeadersPolicyId: addColourHeaders.responseHeadersPolicyId,
          },

        },
      }
    );
    this.dist = distribution

    const hostedZone = HostedZone.fromLookup(this, 'ZoneRef', { domainName: topLevelDomain });

    new ARecord(this, 'ColourAliasRecord', {
      recordName: colourConfig.colourDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone
    });

    new CfnOutput(this, 'DistributionIdOutput', {
      value: distribution.distributionId,
      exportName: colourConfig.distributionIdOutput,
    });

    new CfnOutput(this, 'DistributionDomainNameOutput', {
      value: distribution.distributionDomainName,
      exportName: colourConfig.distributionDomainOutput,
    })
    
    new CfnOutput(this, 'CustomDomainNameOutput', {
      value: colourConfig.colourDomain,
      exportName: `${appName}${config.appEnv}${colour}customdomain`,
    });

  }
}
