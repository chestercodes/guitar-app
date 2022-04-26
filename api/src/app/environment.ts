
export const getGuitarTableName = () => {
  const v = process.env.GUITAR_TABLE
  if(!v){
    throw new Error("GUITAR_TABLE is not present")
  }
  return v
}

export const isLocalstack = () => {
  const localstackEndpoint = process.env.LOCALSTACK_ENDPOINT
  return !!localstackEndpoint
}

export const getEndpoint = () => {
  const v = process.env.LOCALSTACK_ENDPOINT
  if(!v){
    throw new Error("LOCALSTACK_ENDPOINT is not present")
  }
  return v
}

const getEnvVar = (name: string) => {
  const v = process.env[name]
  if(!v){
    throw new Error(`${name} is not present`)
  }
  return v
}

export const getAwsOptions = () => {
  return {
    endpoint: getEndpoint(),
    region: getEnvVar("AWS_REGION"),
    accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY")
  }
}

export const getAwsClientConfig = () => {
  return {
    endpoint: getEndpoint(),
    region: getEnvVar("AWS_REGION"),
    credentials: {
      accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY")
    }
  }
}
