#!/usr/bin/env zx

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const artifacts = [
    {
        env: "SITE_S3_KEY",
        path: "site.zip",
    },
    {
        env: "API_S3_KEY",
        path: "api.zip",
    },
]

const deployArtifact = "deploy.zip"
const testsArtifact = "tests.zip"

//////////////////////////////////////////

const getFileHash = filePath => {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');
    return hex
}

const exitWithError = (message, err) => {
    console.log(message)
    console.log(err)
    process.exit(1)
}

const getEnvOrFail = (name) => {
    const v = process.env[name]
    if (!v) {
        exitWithError(`Cannot get env var '${name}'`)
    }
    return v
}

const branchName = getEnvOrFail("BRANCH_NAME")
const manifestS3Bucket = getEnvOrFail("MANIFEST_S3_BUCKET")

const uploadArtifact = async artifactName => {
    const artifactPath = `out/${artifactName}`
    const deployHash = getFileHash(artifactPath)
    const withoutExt = path.parse(artifactName).name
    const deployKey = `artifacts/${withoutExt}-${deployHash}.zip`
    const deployS3Path = `s3://${manifestS3Bucket}/${deployKey}`
    
    let exists = true
    try {
        await $`aws s3 ls ${deployS3Path}`
    } catch (error) {
        exists = false
    }

    if (exists) {
        console.log(`File already exists at ${deployS3Path}`)
    } else {
        try {
            await $`aws s3 cp ${artifactPath} ${deployS3Path} --no-progress`
        } catch (error) {
            exitWithError(`Failed to upload ${artifactName}`, error)
        }
    }

    return deployKey
}

const deployKey = await uploadArtifact(deployArtifact)
const testKey = await uploadArtifact(testsArtifact)

let uploadedArtifacts = []
for (const artifact of artifacts) {
    const uploadedKey = await uploadArtifact(artifact.path)
    uploadedArtifacts.push({
        env: artifact.env,
        key: uploadedKey
    })
}

let manifest = {
    deployKey,
    testKey,
    artifacts: uploadedArtifacts
}

console.log("Manifest:")
console.log(manifest)

const getManifestPath = () => {
    const now = new Date()
    const iso = now.toISOString()
    const c = i => iso.charAt(i)
    const pairAt = i => [i, i + 1].map(c).join("")
    //012345678101234567820123
    //2011-10-05T14:48:00.000Z
    const nowFormatted = [2, 5, 8].map(pairAt).join("") +
        "_" + [11, 14, 17].map(pairAt).join("")
    const manifestFileName = `${nowFormatted}.json`
    const safeBranchName = encodeURIComponent(branchName)
    const manifestS3Key = `manifests/${safeBranchName}/${manifestFileName}`
    const manifestS3Path = `s3://${manifestS3Bucket}/${manifestS3Key}`
    console.log(`Will upload manifest file to '${manifestS3Path}'`)

    return manifestS3Path
}

const manifestPath = "./manifest.json"
const manifestS3Path = getManifestPath()
fs.writeFileSync(manifestPath, JSON.stringify(manifest))
try {
    await $`aws s3 cp ${manifestPath} ${manifestS3Path}`
} catch (error) {
    exitWithError("Failed to upload manifest", error)
}

console.log("Done")