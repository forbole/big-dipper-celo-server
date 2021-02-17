// Import server side methods
import './register-apis';
// Create collection indexes
import './create-indexes';

import { ApolloServer } from 'apollo-server-express'
import { WebApp } from 'meteor/webapp'

import typeDefs from '../../api/graphql/schema';
import resolvers from '../../api/graphql/resolvers';
import _get from 'lodash/get';

const getCorsOptions = () => {
  // enable all cors
  const enableAllcors = _get(Meteor.settings, 'apolloServer.corsEnableAll', false);
  if (enableAllcors) return true; // will allow all distant queries DANGEROUS
  // enable only a whitelist or nothing
  const corsWhitelist = _get(Meteor.settings, 'apolloServer.corsWhitelist', []);
  const corsOptions =
    corsWhitelist && corsWhitelist.length
      ? {
          origin: function(origin, callback) {
            if (!origin) callback(null, true); // same origin
            if (corsWhitelist.indexOf(origin) !== -1) {
              callback(null, true);
            } else {
              callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
          },
        }
      : process.env.NODE_ENV === 'development'; // default behaviour is activating all in dev, deactivating all in production
  return corsOptions;
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers, introspection: true, playground: true });
const corsOptions = getCorsOptions();

server.applyMiddleware({
    app: WebApp.connectHandlers,
    path: '/graphql',
    cors: corsOptions,

})

// server.installSubscriptionHandlers(WebApp.httpServer);
  
WebApp.connectHandlers.use('/graphql', (req, res) => {
    if (req.method === 'GET') {
      res.end()
    }
})
