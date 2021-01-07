import typeDefs from '../../api/graphql/schema';
import resolvers from '../../api/graphql/resolvers';

import { WebApp } from 'meteor/webapp';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';

new SubscriptionServer({
  schema: typeDefs,
  execute,
  subscribe,
}, {
  server: WebApp.httpServer,
  path: '/subscriptions',
});