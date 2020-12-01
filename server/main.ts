import { Meteor } from "meteor/meteor";
import { newKit } from "@celo/contractkit";


import "../imports/startup/server";

const kit = newKit(Meteor.settings.public.fornoAddress);
const web3 = kit.web3;
let timer,
  timerChain,
  timerValidators,
  timerCoin,
  timerProposals,
  timerTransactions: number = 0;

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
      // console.log("Updated block height to: " + number)
    }

    timerCoin = Meteor.setInterval(updateTokenPrice, 30000);
  });
}

function updateValidators(number: number) {
  Meteor.clearInterval(timerValidators);
  Meteor.call("validators.update", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      // console.log("Updated block height to: " + number)
    }

    timerValidators = Meteor.setInterval(updateValidators, 10000);
  });
}

// Get blocks from the server until the latest block height.
// Continue checking every 10 seconds.
function updateBlock(number: number) {
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

function updateElection(number: Number) {
  Meteor.call("election.update", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated election!");
    }
  })
}

function updateEpoch(number: Number) {
  Meteor.call("epoch.update", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated Epoch!");
    }
  })
}

// Update chain latest status every 10 seconds.
function updateChainState(number: number) {
  Meteor.clearInterval(timerChain);
  Meteor.call("chain.updateChain", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated chain height to: " + result);
    }

    timerChain = Meteor.setInterval(() => {
      web3.eth.getBlockNumber().then((num) => {
        updateChainState(num);
        updateElection(num);
        updateEpoch(num);
      });
    }, 5000);
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


function getAllProposals() {
  Meteor.clearInterval(timerProposals);
  Meteor.call("proposals.getProposals", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("The Proposals have been updated: " + result);
    }

    timerProposals = Meteor.setInterval(getAllProposals, 25000);

  });
}



Meteor.startup(() => {
  // make sure the chain has block
  web3.eth.getBlockNumber().then((number) => {
    Meteor.call("contract.getContractAddress", (error, result) => {
      if (error) {
        console.log(error);
      }

      if (result) {
        console.log("Contracts have been processed " + result);
        updateChainState(number);
        updateValidators(number);
        updateBlock(number);
        updateTokenPrice();
        updatePendingTransactions();
        getAllProposals();
      }
    });
  });
});
