#!/usr/bin/env zx
console.log("Started test.mjs")

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

const downloadFile = async (fileKeyOrPath, localFileName) => {
  const s3Path = fileKeyOrPath

  console.log(`Try download file from '${s3Path}' to '${localFileName}'`)
  try {
    await $`aws s3 cp ${s3Path} ${localFileName}  --no-progress `
  } catch (error) {
    exitWithError("Failed to download file", error)
  }
}

const setEnv = (name, val) => {
  console.log(`Setting ${name} to ${val}`)
  process.env[name] = val
}

const deployedConfigS3Path = getEnvOrFail("DEPLOYED_CONFIG_S3_PATH")
const manifestS3Path = getEnvOrFail("MANIFEST_S3_PATH")
const colour = getEnvOrFail("COLOUR")
const appEnv = getEnvOrFail("APP_ENV")

const deployedConfigName = "deployedConfig.json"
await downloadFile(deployedConfigS3Path, deployedConfigName)
const deployedConfig = JSON.parse(await $`cat ${deployedConfigName}`)

const baseUrl = `https://${deployedConfig.CustomDomain}/`
setEnv("BASE_URL", baseUrl)

try {
  await $`docker-compose -f Tests.yml up --build --exit-code-from run `
} catch (error) {
  const reportPath = "./playwright-report/index.html"
  const reportS3Path = deployedConfigS3Path.replace("/deployments/", "/reports/")
  try {
    await $`aws s3 cp ${reportPath} ${reportS3Path}  --no-progress `
  } catch (reportError) {
    console.log("Failed to upload report")
    console.log(reportError)
  }
  exitWithError("Failed tests", error)
}