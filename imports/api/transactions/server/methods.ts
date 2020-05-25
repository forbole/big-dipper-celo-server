import { Meteor } from 'meteor/meteor';
import { Transactions } from '../../transactions/transactions';
import { Accounts } from '../../accounts/accounts';
import { newKit } from '@celo/contractkit';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
    'transactions.updatePending': async function(){
        let pendingTransactions = Transactions.find({pending:true}).fetch();
        for (let i in pendingTransactions){
            let tx:{[k: string]: any} = await web3.eth.getTransaction(pendingTransactions[i].hash);
            if (tx) {
                console.log("Processing pending transaction: "+tx.hash);
                // insert tx
                try{
                    tx.pending = false;
                    Transactions.upsert({hash: tx.hash},{$set:tx}, (error, result) => {
                        PUB.pubsub.publish(PUB.TRANSACTION_ADDED, { transactionAdded: tx });
                    });
                    if (parseInt(tx.value) > 0) {
                        let balance = await web3.eth.getBalance(tx.to)
                        if (parseInt(balance) > 0){
                            // update or insert address if balance larger than 0
                            Accounts.upsert({address:tx.to}, {$set:{address:tx.to, balance:parseInt(balance)}}, (error, result) => {
                                PUB.pubsub.publish(PUB.ACCOUNT_ADDED, { accountAdded: {address:tx.to, balance:balance} });
                            })
                        }
                    }    
                }
                catch(e){
                    console.log(e)
                }
            }
        }
    }
})