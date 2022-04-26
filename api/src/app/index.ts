import { GuitarRepository } from "./guitar/repository"
import { GuitarDto, GuitarGetDto } from "./shared"

var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// declare a new express app
var app = express()
app.use(bodyParser.json())

const isDevMachine = !process.env.AWS_LAMBDA_FUNCTION_NAME

if (!isDevMachine) {
  app.use(awsServerlessExpressMiddleware.eventContext())
}

if (process.env.COLOUR) {
  const colour = process.env.COLOUR

  app.use(function (req: any, res: any, next: any) {
    res.header("X-Colour", colour)
    next()
  });
}

// Enable CORS for all methods
app.use(function (req: any, res: any, next: any) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

if (isDevMachine) {
  require('dotenv').config()

  app.options('/guitar', async function (req: any, res: any) {
    res.statusCode = 200;
    res.json(null);
  });
}

const invalid = (res: any) => {
  res.statusCode = 422;
  res.json({ error: 'Invalid' });
}

app.get('/guitar', async function (req: any, res: any) {
  const repo = new GuitarRepository()
  const allGuitars = await repo.getAllItems()
  const items: GuitarDto[] = allGuitars.map(x => {
    return {
      id: x.Id,
      make: x.Make,
      model: x.Model,
      imageUrl: x.ImageUrl
    }
  })
  const dto: GuitarGetDto = {
    items: items
  }
  res.json(dto);
});

app.post('/guitar', function (req: any, res: any) {
  if (!req.body.thing) {
    invalid(res)
    return
  }

  res.json({})
})

const thePort = process.env.APP_PORT ?? 3000

app.listen(thePort, function () {
  if (isDevMachine) {
    console.log("App started")
  }
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
