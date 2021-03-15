import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit';

import '../imports/startup/server';

const {
  PerformanceObserver, performance,
} = require('perf_hooks');

const kit = newKit(Meteor.settings.public.fornoAddress);
const { web3 } = kit;
let timer: number = 0;
let timerChain: number = 0;
let timerValidators: number = 0;
let timerCoin: number = 0;
let timerProposals: number = 0;
let timerTransactions: number = 0;
let timerElection: number = 0;
const timerBlockSigners: number = 0;

function updatePendingTransactions() {
  Meteor.clearInterval(timerTransactions);
  Meteor.call('transactions.updatePending', (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      // console.log("Updated pending transactions ")
    }

    timerTransactions = Meteor.setInterval(updatePendingTransactions, 15000);
  });
}

function updateTokenPrice() {
  Meteor.clearInterval(timerCoin);
  Meteor.call('chain.updateCoin', (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      // console.log("Updated token price " )
    }

    timerCoin = Meteor.setInterval(updateTokenPrice, 31000);
  });
}

// Update validators every half an hour
function updateValidators(number: number) {
  Meteor.call('validators.update', number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      // console.log("Updated validators at height: " + number)
    }

    timerValidators = Meteor.setInterval(() => {
      Meteor.clearInterval(timerValidators);
      web3.eth.getBlockNumber().then((num) => {
        updateValidators(num);
      });
    }, 1800000);
  });
}

// Get blocks from the server until the latest block height.
// Continue checking every 10 seconds.
function updateBlock(number: number) {
  Meteor.call('blocks.getBlocks', number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log(`Updated block height to: ${result}`);
    }

    timer = Meteor.setInterval(() => {
      Meteor.clearInterval(timer);
      web3.eth.getBlockNumber().then((num) => {
        updateBlock(num);
      });
    }, 10000);
  });
}

// Update the record for all signers in the blocks
function updateBlockSigners(blockNumber: number) {
  // Meteor.clearInterval(timerBlockSigners);
  Meteor.call('blocks.getBlockSigners', blockNumber, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log(`Updated signers for block ${blockNumber} `);
    }

    Meteor.defer(() => {
      web3.eth.getBlockNumber().then((num) => {
        updateBlockSigners(num);
      });
    });
  });
}

function updateElection(number: Number) {
  Meteor.call('election.update', number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log(`Updated election at height ${number}`);
    }
  });

  timerElection = Meteor.setInterval(() => {
    Meteor.clearInterval(timerElection);
    web3.eth.getBlockNumber().then((num) => {
      updateElection(num);
    });
  }, 1800000);
}

// Update chain latest status every 5 seconds.
function updateChainState(number: number) {
  Meteor.call('chain.updateChain', number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log(`Updated chain height to: ${result}`);
    }

    timerChain = Meteor.setInterval(() => {
      Meteor.clearInterval(timerChain);
      web3.eth.getBlockNumber().then((num) => {
        updateChainState(num);
      });
    }, 5000);
  });
}

function getContractABI() {
  Meteor.call('contract.getContractABI', (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log('Updated contract ABIs ');
    }
  });
}

function updateProposals() {
  Meteor.clearInterval(timerProposals);
  Meteor.call('proposals.getProposals', (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log('Updated proposals ');
    }

    timerProposals = Meteor.setInterval(updateProposals, 300000);
  });
}

Meteor.startup(() => {
  // Make sure the chain has block
  web3.eth.getBlockNumber().then((number) => {
    Meteor.call('contract.getContractAddress', (error, result) => {
      if (error) {
        console.log(error);
      }

      if (result) {
        console.log(`Contracts have been processed ${result}`);
        updateChainState(number);
        updateValidators(number);
        updateBlock(number);
        updateBlockSigners(number);
        updateTokenPrice();
        updatePendingTransactions();
        updateProposals();
        updateElection(number);
      }
    });
  });
});
