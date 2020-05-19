import { Chain } from '../chain/chain';
import { Transactions } from '../transactions/transactions';
import { Accounts } from '../accounts/accounts';
import { Blocks } from '../blocks/blocks';

export default {
    Query: {
        chain() {
            return Chain.findOne()
        },
        transactions: async (_, { pageSize = 20, skip }, { dataSources }) => {
            const totalCounts = Transactions.find().count()
            const transactions = Transactions.find({}, { sort: { blockNumber: -1 }, limit: pageSize, skip: (totalCounts - skip) }).fetch()
            return {
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
        blocks: async (_, { pageSize = 20, skip }, { dataSources }) => {
            const totalCounts = Blocks.find().count()
            const blocks = Blocks.find({}, { sort: { number: -1 }, limit: pageSize, skip: (totalCounts - skip) }).fetch()
            return {
                blocks,
                totalCounts: totalCounts,
                cursor: blocks.length ? blocks[blocks.length-1].number : null,
                hasMore: blocks[blocks.length - 1].number != 1
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