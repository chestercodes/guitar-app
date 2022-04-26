import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getAwsClientConfig, isLocalstack } from './environment';

let dynamoDb: DynamoDB | null = null

export const getDynamoDB = () => {
  if(dynamoDb){
    return dynamoDb
  }
  if (!isLocalstack()) {
    dynamoDb = new DynamoDB({})
    return dynamoDb
  }
  
  console.log("Is running localstack!")
  const options = getAwsClientConfig()
  dynamoDb = new DynamoDB(options);
  return dynamoDb
}

let dynamoDbClient: DynamoDBClient | null = null

export const getDynamoDBClient = () => {
  if (!isLocalstack()) {
    dynamoDbClient = new DynamoDBClient({})
    return dynamoDbClient
  }
  
  console.log("Is running localstack!")
  const options = getAwsClientConfig()
  dynamoDbClient = new DynamoDBClient(options);
  return dynamoDbClient
}
