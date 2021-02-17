
// Import server side methods
import './register-apis';
// Create collection indexes
import './create-indexes';

import { WebApp } from 'meteor/webapp'

import typeDefs from '../../api/graphql/schema';
import resolvers from '../../api/graphql/resolvers';
import { ApolloServer } from "apollo-server"

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers, introspection: true, playground: true });

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
})
