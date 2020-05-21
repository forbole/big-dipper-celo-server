import { Chain } from '../chain/chain';
import { Transactions } from '../transactions/transactions';
import { Accounts } from '../accounts/accounts';
import { Blocks } from '../blocks/blocks';

import PUB from './subscriptions';

export default {
    Subscription: {
        blockAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: () => PUB.pubsub.asyncIterator([PUB.BLOCK_ADDED]),
        },
        transactionAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: () => PUB.pubsub.asyncIterator([PUB.TRANSACTION_ADDED]),
        },
        accountAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: () => PUB.pubsub.asyncIterator([PUB.ACCOUNT_ADDED]),
        },
    },
    Query: {
        chain() {
            return Chain.findOne()
        },
        transactions: async (_, { pageSize = 20, page }, { dataSources }) => {
            const totalCounts = Transactions.find().count()
            const transactions = Transactions.find({}, { sort: { blockNumber: -1 }, limit: pageSize, page: (page-1)*pageSize }).fetch()
            return {
                pageSize: pageSize,
                page: page,
                transactions,
                totalCounts: totalCounts,
                cursor: transactions.length ? transactions[transactions.length - 1].blockNumber : null,
                hasMore: transactions.length == pageSize
            };
        },
        transaction(_, args, context, info){
            return Transactions.findOne({ hash: args.hash})
        },
        account(_, args, context, info){
            return Accounts.findOne({address:args.address})
        },
        blocks: async (_, { pageSize = 20, page }, { dataSources }) => {
            const totalCounts = Blocks.find().count()
            const blocks = Blocks.find({}, { sort: { number: -1 }, limit: pageSize, page: (page-1)*pageSize }).fetch()
            return {
                pageSize: pageSize,
                page: page,
                blocks,
                totalCounts: totalCounts,
                cursor: blocks.length ? blocks[blocks.length-1].number : null,
                hasMore: blocks.length ? blocks[blocks.length - 1].number != 1 : false
            };
        },
        block(_, args, context, info){
            return Blocks.findOne({number: args.number})
        }
    },
    Block: {
        transactions(parent){
            return Transactions.find({hash: {$in:parent.transactions}}).fetch()
        }
    }
}