// register server side methods
import "../../api/blocks/server/methods"
import "../../api/transactions/server/methods"

// create indexes
import { Blocks } from '../../api/blocks/blocks';
import { Accounts } from '../../api/accounts/accounts';
import { Transactions } from '../../api/transactions/transactions';

import { ApolloServer, gql } from 'apollo-server-express'
import { WebApp } from 'meteor/webapp'

Blocks.rawCollection().createIndex({number: -1},{unique:true});
Accounts.rawCollection().createIndex({address: 1},{unique:true});
Transactions.rawCollection().createIndex({blockHash: 1}, {unique:true});


