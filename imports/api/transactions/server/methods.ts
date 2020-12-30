import { Meteor } from 'meteor/meteor';
import { Transactions } from '../../transactions/transactions';
import { Contracts } from '../../contracts/contracts';
import { newKit } from '@celo/contractkit';
import * as abiDecoder from 'abi-decoder';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;
// let web3Provider = web3.currentProvider.existingProvider.host;

// console.log("=== current provider: %o", web3Provider);

interface PendingTransactionsInterface {
    [i: string]: any;
    hash?: string;
}

interface ContractInterface {
    [i: string]: any;
    ABI?: any;

}

Meteor.methods({
    'transactions.updatePending': async function () {
        this.unblock()
        let pendingTransactions: PendingTransactionsInterface = Transactions.find({ pending: true }).fetch();
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
                    Meteor.call('accounts.update', tx.from, (error, result) => {
                        if (error) {
                            console.log("Error when processing Pending Transactions " + error)
                        }
                        if (result) {
                            console.log(result)
                        }
                    });

                    if (parseInt(tx.value) > 0) {
                        // this is a money transfer txn
                        // store the recepient account
                        // let balance = await web3.eth.getBalance(tx.to)

                        if (tx.to) {
                            Meteor.call('accounts.update', tx.to, (error, result) => {
                                if (error) {
                                    console.log("Error when updating Account Transactions (Transfer) " + error)
                                }
                                if (result) {
                                    console.log(result)
                                }
                            })
                        }

                        tx.type = 'transfer';
                    }
                    else {
                        // this is a contract call
                        // the tx address will be the contract address

                        if (tx.input != "0x") {
                            // make sure it has input in the txn
                            let contract: ContractInterface = Contracts.findOne({ address: tx.to });
                            if (!!contract && !!contract.ABI) {
                                abiDecoder.addABI(contract.ABI);
                                let decodedInput = abiDecoder.decodeMethod(tx.input);
                                // if ((contract.name == "GoldToken" || contract.name == "StableToken")
                                //     && decodedInput && decodedInput.name
                                //     && ((decodedInput.name == 'transfer') || (decodedInput.name == 'transferWithComment') || (decodedInput.name == 'transferFrom'))
                                //     ){
                                // console.log("=== Contract Name: %o", contract.name);
                                // console.log("=== Function Name: %o", decodedInput.name);
                                // console.log("=== Input Params: %o", decodedInput.params);
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
                                // }

                                if (decodedInput) {
                                    tx.decodedInput = decodedInput;
                                    tx.type = decodedInput.name;
                                }
                            }
                            else {
                                tx.type = 'contractCall'
                            }
                        }

                        if (tx.to) {
                            Meteor.call('accounts.update', tx.to, (error, result) => {
                                if (error) {
                                    console.log("Error when updating Account Transaction (Tx.to) " + error)
                                }
                                if (result) {
                                    console.log(result)
                                }
                            })
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
})