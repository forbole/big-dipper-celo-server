
// Import server side methods
import './register-apis';
// Create collection indexes
import './create-indexes';

import { ApolloServer } from 'apollo-server-express'
import { WebApp } from 'meteor/webapp'

import typeDefs from '../../api/graphql/schema';
import resolvers from '../../api/graphql/resolvers';

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers });

server.applyMiddleware({
    app: WebApp.connectHandlers,
    path: '/graphql'
})

server.installSubscriptionHandlers(WebApp.httpServer);
  
WebApp.connectHandlers.use('/graphql', (req, res) => {
    if (req.method === 'GET') {
      res.end()
    }
})