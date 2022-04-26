#!/usr/bin/env zx
const fs = require("fs")
const shared = require('./shared')

console.log("Started deploy.mjs")

const exitWithError = (message, err) => {
  console.log(message)
  console.log(err)
  process.exit(1)
}

const getEnvOrFail = (name) => {
  const v = process.env[name]
  if (!v || v === "") {
    exitWithError(`Cannot get env var '${name}'`)
  }
  return v
}

const deployedConfigS3Path = getEnvOrFail("DEPLOYED_CONFIG_S3_PATH")
const manifestS3Path = getEnvOrFail("MANIFEST_S3_PATH")
const colour = getEnvOrFail("COLOUR")
const appEnv = getEnvOrFail("APP_ENV")

const pipelineBucket = manifestS3Path.substring("s3://".length).split('/')[0]
console.log(`Bucket: ${pipelineBucket}`)
process.env.PIPELINE_BUCKET = pipelineBucket

const deployStack = async (stackName, outputsFile) => {
  const args = !outputsFile ? [] : ["--outputs-file", outputsFile]
  args.push("-f")
  args.push("--require-approval")
  args.push("never")
  console.log(`Running with args '${args}'`)
  try {
    await $`cdk deploy ${stackName} ${args} `
  } catch (error) {
    process.exit(1)
  }
}

const appName = "guitarapp"

await deployStack(`${appName}-cert`)

const configDataFileName = "./config.data.json"
await deployStack(`${appName}-${appEnv}-data`, configDataFileName)

const infraStackName = `${appName}-${appEnv}-infra`
const configInfraFileName = "./config.infra.json"
await deployStack(infraStackName, configInfraFileName)

const deployStackName = `${appName}-${appEnv}-deploy-${colour}`
const configDeployFileName = "./config.deploy.json"
await deployStack(deployStackName, configDeployFileName)

await $`cat ${configDataFileName}`
await $`cat ${configInfraFileName}`
await $`cat ${configDeployFileName}`

const getConfigByPrefix = (config, name) => {
  console.log(`Looking for ${name}`)

  for (const k of Object.keys(config)) {
    if (k.startsWith(name)) {
      const v = config[k]
      console.log(`Found value '${v}'`)
      return v
    }
  }

  throw new Error("Could not find value!")
}

const uploadSiteConfigFile = async () => {
  const deployConfig = await $`cat ${configDeployFileName}`
  const deployConfigObj = JSON.parse(deployConfig)[deployStackName]
  const siteConfig = getConfigByPrefix(deployConfigObj, "SiteConfigOutputName")
  const bucketName = getConfigByPrefix(deployConfigObj, "SiteBucketOutputName")

  const siteConfigName = "siteConfig.json"
  fs.writeFileSync(siteConfigName, siteConfig)
  const siteConfigS3Path = `s3://${bucketName}/${shared.siteConfigFileName}`
  try {
    await $`aws s3 cp ${siteConfigName} ${siteConfigS3Path}`
  } catch (error) {
    exitWithError(`Failed to upload config`, error)
  }
}

await uploadSiteConfigFile()

const generateConfigFile = async () => {
  let outputs = []

  const infraOutputs = await $`cat ${configInfraFileName}`
  console.log("Infra outputs:")
  console.log(infraOutputs)
  const infra = JSON.parse(infraOutputs)[infraStackName]
  const colourPrefix = colour === "blue" ? "Blue" : "Green"
  const domainName = getConfigByPrefix(infra, colourPrefix + "DistributionDomainNameOutput")
  outputs.push({
    name: "DistributionDomain",
    value: domainName
  })

  const customDomainName = getConfigByPrefix(infra, colourPrefix + "CustomDomainNameOutput")
  outputs.push({
    name: "CustomDomain",
    value: customDomainName
  })

  if (outputs.length !== 2) {
    exitWithError("Could not find outputs")
  }

  let deployedConfig = {}
  for (const output of outputs) {
    deployedConfig[output.name] = output.value
  }

  return deployedConfig
}

const deployedConfig = await generateConfigFile()
const deployedConfigPath = "./deployedConfig.json"
fs.writeFileSync(deployedConfigPath, JSON.stringify(deployedConfig))

try {
  await $`aws s3 cp ${deployedConfigPath} ${deployedConfigS3Path}`
} catch (error) {
  exitWithError(`Failed to upload config`, error)
}
