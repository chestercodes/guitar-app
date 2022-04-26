export const blueDistIdName = "BLUE_DIST_ID"
export const wwwDomainName = "WWW_DOMAIN"
export const appEnvName = "APP_ENV"
export const pipelineBucketName = "PIPELINE_BUCKET"

const getEnv = (name: string) => {
    const v = process.env[name]
    if (!v) throw new Error(`Environment needs ${name}`)
    return v
}

/*
    add or remove www.<TopLevelDomain>.com to the blue cloudfront instance
    this switches the traffic from blue to green or back
    if not prod then don't change aliases, only write file
*/
export const handler = (event: any, context: any) => {
    const colour: string = event.colour
    if (!colour) {
        throw new Error("Need to specify colour!")
    }
    const isBlue = colour.toLowerCase() === "blue"

    const distributionId = getEnv(blueDistIdName)
    const wwwDomain = getEnv(wwwDomainName)
    const appEnv = getEnv(appEnvName)
    const pipelineBucket = getEnv(pipelineBucketName)

    const isProd = appEnv === "prod"
    const deployedColourKey = `state/${appEnv}/deployedColour.txt`

    const AWS = require('aws-sdk')
    const cloudfront = new AWS.CloudFront();
    // https://javascript.hotexamples.com/examples/aws-sdk/CloudFront/updateDistribution/javascript-cloudfront-updatedistribution-method-examples.html
    cloudfront.getDistribution({ Id: distributionId }, function (err: any, res: any) {
        if (err) {
            console.log(err, err.stack);
            return
        }

        let hasDoneSomething = false

        const dist = res.Distribution.DistributionConfig
        const aliases: string[] = dist.Aliases.Items
        if (isBlue) {
            console.log("Deploy blue")
            if (!aliases.includes(wwwDomain)) {
                if (isProd) {
                    console.log("www domain not present, add!")
                    hasDoneSomething = true
                    aliases.push(wwwDomain)
                    dist.Aliases.Quantity++
                } else {
                    console.log("Is not prod, do not change aliases")
                }
            }
        } else {
            console.log("Deploy green")
            if (aliases.includes(wwwDomain)) {
                if (isProd) {
                    console.log("www domain is present, remove!")
                    hasDoneSomething = true
                    dist.Aliases.Items = aliases.filter(x => x !== wwwDomain)
                    dist.Aliases.Quantity--
                } else {
                    console.log("Is not prod, do not change aliases")
                }
            }
        }

        var distParams = {
            Id: distributionId,
            DistributionConfig: dist,
            IfMatch: res.ETag
        };
        if (hasDoneSomething) {
            cloudfront.updateDistribution(distParams, function (err: any, data: any) {
                if (err) {
                    console.log(err, err.stack);
                }
                else {
                    console.log(data);
                }
            });
        } else {
            console.log("Do nothing, no change needed.")
        }

        console.log(`Saving colour deployed file to ${pipelineBucket}`)

        const AWS = require('aws-sdk')
        const s3 = new AWS.S3();

        const s3Params = {
            Body: colour,
            Bucket: pipelineBucket,
            Key: deployedColourKey
        };
        s3.putObject(s3Params, (err: any, data: any) => {
            if (err) {
                console.log("Error occured:")
                console.log(err)
            }
            else {
                console.log(data)
                console.log("done")
            }
        });

    });
}
//end