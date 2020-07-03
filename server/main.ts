import { Meteor } from "meteor/meteor";
import { newKit, CeloContract } from "@celo/contractkit";

import "../imports/startup/server";

const kit = newKit(Meteor.settings.public.fornoAddress);
const web3 = kit.web3;
let timer,
  timerChain,
  timerValidators,
  timerCoin,
  timerTransactions: Number = 0;

function updatePendingTransactions() {
  Meteor.clearInterval(timerTransactions);
  Meteor.call("transactions.updatePending", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      // console.log("Updated block height to: "+number)
    }

    timerTransactions = Meteor.setInterval(updatePendingTransactions, 15000);
  });
}

function updateTokenPrice() {
  Meteor.clearInterval(timerCoin);
  Meteor.call("chain.updateCoin", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      // console.log("Updated block height to: "+number)
    }

    timerCoin = Meteor.setInterval(updateTokenPrice, 30000);
  });
}

function updateValidators() {
  Meteor.clearInterval(timerValidators);
  Meteor.call("validators.update", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      // console.log("Updated block height to: "+number)
    }

    timerValidators = Meteor.setInterval(updateValidators, 10000);
  });
}

// Get blocks from the server until the latest block height.
// Continue checking every 10 seconds.
function updateBlock(number: Number) {
  Meteor.clearInterval(timer);
  Meteor.call("blocks.getBlocks", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated block height to: " + result);
    }

    timer = Meteor.setInterval(() => {
      web3.eth.getBlockNumber().then((num) => {
        updateBlock(num);
      });
    }, 10000);
  });
}

// Update chain latest status every 10 seconds.
function updateChainState(number: Number) {
  Meteor.clearInterval(timerChain);
  Meteor.call("chain.updateChain", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated chain height to: " + result);
    }

    // timerChain = Meteor.setInterval(() => {
    //   web3.eth.getBlockNumber().then((num) => {
    //     updateChainState(num);
    //   });
    // }, 5000);
  });
}

function getContracts() {
  Meteor.call("contract.getContractAddress", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Contracts have been processed " + result);
    }
  });
}

function getContractABI() {
  Meteor.call("contract.getContractABI", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("The contract ABIs have been processed: " + result);
    }
  });
}

async function getAccount(address: String) {
  Meteor.call("accounts.getAccountSummary", address, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log(result);
      // console.log("==================1================")
      // console.log(JSON.stringify(result));
      // console.log("The account details: " + result);
    }
  });
}

Meteor.startup(() => {
  // make sure the chain has block
  web3.eth.getBlockNumber().then((number) => {
    updateChainState(number);
    updateValidators();
    updateBlock(number);
    updateTokenPrice();
    updatePendingTransactions();
    getContracts();
    getContractABI();
    getAccount(address);
  });
});
