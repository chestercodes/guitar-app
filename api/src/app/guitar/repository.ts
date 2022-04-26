import { DynamoDB, GetItemCommandInput, PutItemCommandInput, ScanCommandInput } from '@aws-sdk/client-dynamodb';
import { getDynamoDB } from '../dynamo';
import { getGuitarTableName } from '../environment';
import { Guitar } from "./model";
import { itemToModel, toDynamoItem } from './entity';

const getTableName = () => {
  return getGuitarTableName()
}

export class GuitarRepository {
  private _dynamoDb: DynamoDB;

  constructor() {
    this._dynamoDb = getDynamoDB()
  }

  async getItemById(id: string): Promise<Guitar | null> {
    var params: GetItemCommandInput = {
      TableName: getTableName(),
      Key: {
        'id': { S: id }
      },
    };

    const itemOrNull = await this._dynamoDb.getItem(params)
    if (!itemOrNull.Item) {
      return null
    }

    return itemToModel(itemOrNull.Item!)
  }

  async put(guitar: Guitar) {
    const params: PutItemCommandInput = {
      TableName: getTableName(),
      Item: toDynamoItem(guitar),
    }

    await this._dynamoDb.putItem(params)

    return guitar
  }

  async getAllItems(): Promise<Guitar[]> {
    
    const input: ScanCommandInput = {
      TableName: getTableName(),
    }
    
    const values = await this._dynamoDb.scan(input)
    
    return values.Items!
      .map(x => itemToModel(x))
      .filter(x => x !== null)
      .map(x => x!)
  }
}