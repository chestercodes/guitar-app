import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { CertificateValidation, DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { Config } from './config';

export class CertStack extends Stack {
  constructor(scope: Construct, id: string, config: Config, props?: StackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromLookup(this, 'ZoneRef', { domainName: config.topLevelDomain });

    const certificate = new DnsValidatedCertificate(this, "Certificate", {
      domainName: config.topLevelDomain,
      subjectAlternativeNames: [
        `*.${config.topLevelDomain}`
      ],
      hostedZone,
      validation: CertificateValidation.fromDns(hostedZone),
      // region: 'us-east-1', // Cloudfront only checks this region for certificates.
    })

    new CfnOutput(this, 'CertificateOutput', {
      value: certificate.certificateArn,
      exportName: config.certificateArnOutput,
    })

  }
}
