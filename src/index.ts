// Imports
import * as cors from 'cors'
import * as dotenv from 'dotenv'
import * as express from 'express'
import { createServer } from 'http'
import * as morgan from 'morgan'
import * as mongoose from 'mongoose'
import graphQLServer from './graphql/schema'
import auth from './services/auth'
import models from './models/index'

// Environment variables
dotenv.config()

// App setup
const app = express()
const port = process.env.PORT || 8081
const SECRET = process.env.SECRET || 11111

// Database connection
const MONGO_URI = `mongodb://${process.env.MONGO_USER}:${
  process.env.MONGO_PASS
  }${process.env.MONGO_URL}`

mongoose
  .connect(
    MONGO_URI,
    { useNewUrlParser: true }
  )
  .then(
    (): void => {
      console.log('Connection to database successful')
    }
  )
  .catch(
    (err): void => {
      console.log(err)
    }
  )

// Add user to context
app.use(async (req, res, next) => {
  await auth.addUser(req, res, next, models, SECRET)
})

// Logger
app.use(morgan('dev'))

// CORS
app.use(cors())

// Apply GraphQL server
const httpServer = createServer(app)
graphQLServer.applyMiddleware({ app })
graphQLServer.installSubscriptionHandlers(httpServer)

// Wrap the Express server
httpServer.listen({ port }, () => {
  console.log(`🚀 Server ready at http://localhost:${port}${graphQLServer.graphqlPath}`)
  console.log(`🚀 Subscriptions ready at ws://localhost:${port}${graphQLServer.subscriptionsPath}`)
})
