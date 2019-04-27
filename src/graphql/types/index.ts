import gql from 'graphql-tag'

const baseTypes = gql`
  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`

export const typeDefs = [baseTypes]
