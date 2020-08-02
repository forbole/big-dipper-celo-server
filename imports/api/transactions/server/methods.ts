import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Transactions } from '../../transactions/transactions';
import { Contracts } from '../../contracts/contracts';
import { newKit } from '@celo/contractkit';
import * as abiDecoder from 'abi-decoder';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;
// let web3Provider = web3.currentProvider.existingProvider.host;

// console.log("=== current provider: %o", web3Provider);

Meteor.methods({
    'transactions.updatePending': async function(){
        let pendingTransactions = Transactions.find({pending:true}).fetch();
        for (let i in pendingTransactions){
            let tx:{[k: string]: any} = await web3.eth.getTransaction(pendingTransactions[i].hash);
            if (tx) {
                console.log("Processing pending transaction: "+tx.hash);
                // insert tx
                try{
                    Meteor.call('accounts.update', tx.from, (error, result) => {
                        if (error) {
                            console.log(error)
                        }
                        if (result) {
                            console.log(result)
                        }
                    });
                    
                    if (parseInt(tx.value) > 0) {
                        // this is a money transfer txn
                        // store the recepient account
                        // let balance = await web3.eth.getBalance(tx.to)


                        Meteor.call('accounts.update', tx.to, (error, result) => {
                            if (error){
                                console.log(error)
                            }
                            if (result){
                                console.log(result)
                            }
                        })

                        tx.type = 'transfer';
                    }
                    else{
                        // this is a contract call
                        // the tx address will be the contract address

                        if (tx.input != "0x"){
                            // make sure it has input in the txn
                            let contract = Contracts.findOne({address:tx.to});
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
                                if (decodedInput && decodedInput.name){
                                    for (let i in decodedInput.params){
                                        if (decodedInput.params[i].type == 'address'){
                                            Meteor.call('accounts.update', decodedInput.params[i].value, (error, result) => {
                                                if (error){
                                                    console.log(error)
                                                }
                                                if (result){
                                                    console.log(result)
                                                }
                                            })
                                        }
                                    }
                                }
                                // }

                                if (decodedInput){
                                    tx.decodedInput = decodedInput;
                                    tx.type = decodedInput.name;
                                }
                            }
                            else{
                                tx.type = 'contractCall'
                            }
                        }

                        Meteor.call('accounts.update', tx.to, (error, result) => {
                            if (error){
                                console.log(error)
                            }
                            if (result){
                                console.log(result)
                            }
                        })
                    }

                    tx.pending = false;
                    Transactions.update({ hash: tx.hash }, { $set: tx }, (error, result) => {
                        PUB.pubsub.publish(PUB.TRANSACTION_ADDED, { transactionAdded: tx });
                    });

                }
                catch(e){
                    console.log(e)
                }
            }
        }
    }
})