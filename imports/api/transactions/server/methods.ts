import { Meteor } from 'meteor/meteor';
import { Transactions } from '../../transactions/transactions';
import { Contracts } from '../../contracts/contracts';
import { newKit } from '@celo/contractkit';
import * as abiDecoder from 'abi-decoder';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

interface PendingTransactionsInterface {
    [i: string]: any;
    hash?: string;
}

interface ContractInterface {
    [i: string]: any;
    ABI?: any;

}


const updatePendingTransactions = (tx) => {
    Meteor.call('accounts.update', tx?.from, (error, result) => {
        if (error) {
            console.log("Error when processing Pending Transactions " + error)
        }
        if (result) {
            console.log(result)
        }
    });
};

const updateTransactions = (tx) => {
     Meteor.call('accounts.update', tx?.to, (error, result) => {
        if (error) {
            console.log("Error when updating Account Transactions (Transfer) " + error)
        }
        if (result) {
            console.log(result)
        }
    })
};

const decodeTransaction = (tx) => {
        let contract: ContractInterface
        try{
            // make sure it has input in the txn
            contract = Contracts.findOne({ address: tx.to });
        }
        catch(e){
            console.log("Error when looking for contract in DB " + e)
        }
      
        if (!!contract && !!contract.ABI) {
            abiDecoder.addABI(contract.ABI);
            let decodedInput = abiDecoder.decodeMethod(tx.input);

            if (decodedInput && decodedInput.name) {
                for (let i in decodedInput.params) {
                    if (decodedInput.params[i].type == 'address') {
                        Meteor.call('accounts.update', decodedInput.params[i].value, (error, result) => {
                            if (error) {
                                console.log("Error when updating Account Decoded Tx " + error)
                            }
                            if (result) {
                                console.log(result)
                            }
                        })
                    }
                }
            }

            if (decodedInput) {
                tx.decodedInput = decodedInput;
                tx.type = decodedInput.name;
            }
        }
        else {
            tx.type = 'contractCall'
        }
};

Meteor.methods({
    'transactions.updatePending': async function () {
        this.unblock()
        let pendingTransactions: PendingTransactionsInterface
        try{
             pendingTransactions = Transactions.find({ pending: true }).fetch();
        }
        catch(e){
            console.log("Error when updating pending transactions " + e)
        }
        for (let i in pendingTransactions) {
            let tx: { [k: string]: any };
            try {
                tx = pendingTransactions[i] && pendingTransactions[i].hash ? await web3.eth.getTransaction(pendingTransactions[i].hash) : null;
            }
            catch (error) {
                console.log("Error when updating Pending Transactions " + error)
            }

            if (tx) {
                console.log("Processing pending transaction: " + tx.hash);
                // insert tx
                try {
                   updatePendingTransactions(tx)
                   
                    if (parseInt(tx.value) > 0) {
                        // this is a money transfer txn
                        // store the recepient account
                        if (tx.to) {
                           updateTransactions(tx)
                        }
                        tx.type = 'transfer';
                    }
                    else {
                        // this is a contract call
                        // the tx address will be the contract address

                        if (tx.input != "0x") {
                            decodeTransaction(tx)
                        }

                        if (tx.to) {
                           updateTransactions(tx)
                        }
                    }

                    tx.pending = false;
                    Transactions.update({ hash: tx.hash }, { $set: tx }, (error: any, result: any) => {
                        PUB.pubsub.publish(PUB.TRANSACTION_ADDED, { transactionAdded: tx });
                    });

                }
                catch (e) {
                    console.log("Error when trying to process Pending Transactions " + e)
                }
            }
        }
    }
});