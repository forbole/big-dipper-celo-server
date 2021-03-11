import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit';
import * as abiDecoder from 'abi-decoder';
import Transactions from '../transactions';
import Contracts from '../../contracts/contracts';

import PUB from '../../graphql/subscriptions';

const kit = newKit(Meteor.settings.public.fornoAddress);
const { web3 } = kit;

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
      console.log(`Error when processing Pending Transactions ${error}`);
    }
    if (result) {
      console.log(result);
    }
  });
};

const updateTransactions = (tx) => {
  Meteor.call('accounts.update', tx?.to, (error, result) => {
    if (error) {
      console.log(`Error when updating Account Transactions (Transfer) ${error}`);
    }
    if (result) {
      console.log(result);
    }
  });
};

const decodeTransactionReceipt = async (tx) => {
  const stableTokenContract: ContractInterface = Contracts.findOne({
    name: 'StableToken',
  });
  if (tx) {
    const txReceipt = await web3.eth.getTransactionReceipt(tx.hash);
    abiDecoder.addABI(stableTokenContract.ABI);
    const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
    if (decodedLogs) {
      for (let i = 0; i < decodedLogs[0]?.events.length; i++) {
        if (decodedLogs[0]?.events[i]?.type === 'address') {
          Meteor.call('accounts.update', decodedLogs[0]?.events[i]?.value, (error, result) => {
            if (error) {
              console.log(`Error when updating Account Decoded Tx ${error}`);
            }
            if (result) {
              console.log(`Updated Account Info ${result}`);
            }
          });
        }
      }
      tx.decodedInput = decodedLogs;
      tx.type = decodedLogs[0]?.name;
    } else {
      tx.type = 'contractCall';
    }
  }
};

const decodeTransaction = async (tx) => {
  // make sure it has input in the txn
  const contract: ContractInterface = Contracts.findOne({
    address: tx.to,
  });
  if (contract && contract.ABI) {
    abiDecoder.addABI(contract.ABI);
    const decodedInput = abiDecoder.decodeMethod(tx.input);
    if (decodedInput && decodedInput.name) {
      for (const i in decodedInput.params) {
        if (decodedInput.params[i].type === 'address') {
          Meteor.call('accounts.update', decodedInput.params[i].value, (error, result) => {
            if (error) {
              console.log(`Error when updating Account Decoded Tx ${error}`);
            }
            if (result) {
              console.log(result);
            }
          });
        }
      }
    }
    if (decodedInput) {
      tx.decodedInput = decodedInput;
      tx.type = decodedInput.name;
    }
  } else {
    await decodeTransactionReceipt(tx);
  }
};

Meteor.methods({
  'transactions.updatePending': async function () {
    this.unblock();
    const pendingTransactions: PendingTransactionsInterface = Transactions.find({
      pending: true,
    }).fetch();
    for (const i in pendingTransactions) {
      if (i) {
        let tx: { [k: string]: any };
        try {
          tx = pendingTransactions[i] && pendingTransactions[i].hash ? await web3.eth.getTransaction(pendingTransactions[i].hash) : null;
        } catch (error) {
          console.log(`Error when updating Pending Transactions ${error}`);
        }

        if (tx) {
          console.log(`Processing pending transaction: ${tx.hash}`);
          // insert tx
          try {
            updatePendingTransactions(tx);

            if (parseInt(tx.value) > 0) {
            // this is a money transfer txn
            // store the recepient account
              if (tx.to) {
                updateTransactions(tx);
              }
              tx.type = 'transfer';
            } else {
            // this is a contract call
            // the tx address will be the contract address

              if (tx.input !== '0x') {
                await decodeTransaction(tx);
              }

              if (tx.to) {
                updateTransactions(tx);
              }
            }

            tx.pending = false;
            Transactions.update({
              hash: tx.hash,
            }, {
              $set: tx,
            }, (error: any, result: any) => {
              PUB.pubsub.publish(PUB.TRANSACTION_ADDED, {
                transactionAdded: tx,
              });
            });
          } catch (e) {
            console.log(`Error when trying to process Pending Transactions ${e}`);
          }
        }
      }
    }
  },
});
