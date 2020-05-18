import { Chain } from '../chain/chain';
import { Transactions } from '../transactions/transactions';
import { Accounts } from '../accounts/accounts';
import { Blocks } from '../blocks/blocks';

export default {
    Query: {
        chain() {
            return Chain.findOne()
        },
        transaction(parent, args, context, info){
            return Transactions.findOne({ hash: args.hash})
        },
        account(parent, args, context, info){
            return Accounts.findOne({address:args.address})
        },
        block(parent, args, context, info){
            return Blocks.findOne({number: args.number})
        }
    },
    Block: {
        transactions(parent){
            return Transactions.find({hash: {$in:parent.transactions}}).fetch()
        }
    }
}