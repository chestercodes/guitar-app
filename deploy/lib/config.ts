export const topLevelDomain = "dontwasteyourweeks.com"

export const appName = "guitarapp"

export interface DeployConfig {
    restApiName: string
    apiFunctionS3Key: string
    apiFunctionName: string
    siteS3Key: string
    restApiBaseUrlOutputName: string
    siteBucketOutputName: string
    siteConfigOutputName: string
}

export interface DataConfig {
    guitarTableName: string
}

export interface InfraColourConfig {
    siteBucketNameExportName: string
    domainNames: string[]
    colourDomain: string
    distributionIdOutput: string
    distributionDomainOutput: string
}

export interface InfraConfig {
    blue: InfraColourConfig
    green: InfraColourConfig
    switchFunctionAssetPath: string
    switchFunctionName: string
}

export interface Config {
    appEnv: string
    isProd: boolean
    colour: string
    awsAccount: string
    awsRegion: string
    pipelineBucket: string
    topLevelDomain: string
    certificateArnOutput: string
    infra: InfraConfig
    data: DataConfig
    deploy: DeployConfig
    deployingInfraColour: InfraColourConfig
}

const getEnvVar = (name: string) => {
    const v = process.env[name]
    if (!v) {
        throw new Error(`Need to specify ${name}`);
    }
    return v
}

export const getConfig = () => {
    const awsAccount = getEnvVar("AWS_ACCOUNT")
    const awsRegion = getEnvVar("AWS_REGION")
    const colour = getEnvVar("COLOUR")
    const appEnv = getEnvVar("APP_ENV")
    const pipelineBucket = getEnvVar("PIPELINE_BUCKET")
    const apiFunctionS3Key = getEnvVar("API_S3_KEY")
    const siteS3Key = getEnvVar("SITE_S3_KEY")

    const guitarTableName = `${appName}-${appEnv}-guitars`

    const isProd = appEnv === "prod"

    const getSiteBucketNameExportName = (colour: string) => `${appName}${appEnv}${colour}sitebucketname`
    const getdistributionIdExportName = (colour: string) => `${appName}${appEnv}${colour}cdnid`
    const getdistributionDomainExportName = (colour: string) => `${appName}${appEnv}${colour}cdndomain`

    const getColourDomain = (colour: string) => isProd ? `${colour}.${topLevelDomain}` : `${colour}-${appEnv}.${topLevelDomain}`
    const wwwDomain = isProd ? [`www.${topLevelDomain}`] : []
    const wildcardDomain = isProd ? [`*.${topLevelDomain}`] : []
    const blueDomain = getColourDomain("blue")
    const greenDomain = getColourDomain("green")

    const getDeployConfig = () => {
        const config: DeployConfig = {
            restApiName: `${appName}-${appEnv}-${colour}-api`,
            apiFunctionS3Key,
            apiFunctionName: `${appName}-${appEnv}-${colour}-api`,
            siteS3Key,
            siteBucketOutputName: `${appName}${appEnv}${colour}sitebucket`,
            restApiBaseUrlOutputName: `${appName}${appEnv}${colour}apiurl`,
            siteConfigOutputName: `${appName}${appEnv}${colour}siteconfig`
        }
        return config
    }

    const blueInfraColourConfig: InfraColourConfig = {
        siteBucketNameExportName: getSiteBucketNameExportName("blue"),
        distributionIdOutput: getdistributionIdExportName("blue"),
        distributionDomainOutput: getdistributionDomainExportName("blue"),
        colourDomain: blueDomain,
        domainNames: wwwDomain.concat([blueDomain])
    }
    const greenInfraColourConfig: InfraColourConfig = {
        siteBucketNameExportName: getSiteBucketNameExportName("green"),
        distributionIdOutput: getdistributionIdExportName("green"),
        distributionDomainOutput: getdistributionDomainExportName("green"),
        colourDomain: greenDomain,
        domainNames: wildcardDomain.concat([greenDomain])
    }

    const deployingInfraColour = colour === "blue" ? blueInfraColourConfig : greenInfraColourConfig

    const config: Config = {
        appEnv,
        isProd,
        colour,
        awsAccount,
        awsRegion,
        pipelineBucket,
        data: {
            guitarTableName
        },
        infra: {
            blue: blueInfraColourConfig,
            green: greenInfraColourConfig,
            switchFunctionAssetPath: `./lib/switch/index.js`,
            switchFunctionName: `${appName}-${appEnv}-switch-colour`
        },
        deploy: getDeployConfig(),
        deployingInfraColour,
        topLevelDomain,
        certificateArnOutput: `${appName}certarn`,
    }

    return config
}