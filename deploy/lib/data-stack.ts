import { Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { Config } from './config';

export class DataStack extends Stack {
  constructor(scope: Construct, id: string, config: Config, props?: StackProps) {
    super(scope, id, props);

    new Table(this, 'GuitarTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      tableName: config.data.guitarTableName,
    })

  }
}
