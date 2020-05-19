// register server side methods
import "../../api/blocks/server/methods"
import "../../api/transactions/server/methods"

// create indexes
import { Blocks } from '../../api/blocks/blocks';
import { Accounts } from '../../api/accounts/accounts';
import { Transactions } from '../../api/transactions/transactions';

import { ApolloServer } from 'apollo-server-express'
import { WebApp } from 'meteor/webapp'

Blocks.rawCollection().createIndex({number: -1},{unique:true});
Accounts.rawCollection().createIndex({address: 1},{unique:true});
Transactions.rawCollection().createIndex({hash: 1}, {unique:true});
Transactions.rawCollection().createIndex({ blockNumber: -1 });
Transactions.rawCollection().createIndex({ to: 1 });
Transactions.rawCollection().createIndex({ from: 1 });


import typeDefs from '../../api/graphql/schema';
import resolvers from '../../api/graphql/resolvers';

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers });

server.applyMiddleware({
    app: WebApp.connectHandlers,
    path: '/graphql'
})
  
WebApp.connectHandlers.use('/graphql', (req, res) => {
    if (req.method === 'GET') {
      res.end()
    }
})