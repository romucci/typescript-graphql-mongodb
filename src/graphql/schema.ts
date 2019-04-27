// Imports
import { ApolloServer } from "apollo-server-express";
import resolvers from "./resolvers";
import { typeDefs } from "./types";
import models from "../models";

require("dotenv").config();
const SECRET = process.env.SECRET;

// GraphQL server
const graphQLServer = new ApolloServer({
  context: ({ req, res }) => ({
    models,
    SECRET,
    user: req.user
  }),
  introspection: true,
  playground: true,
  resolvers,
  typeDefs
});

// Exports
export default graphQLServer;
