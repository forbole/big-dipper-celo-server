import { Meteor } from "meteor/meteor";
import { newKit } from "@celo/contractkit";


import "../imports/startup/server";

const kit = newKit(Meteor.settings.public.fornoAddress);
const web3 = kit.web3;
let timer: number = 0;
let timerChain:number = 0;
let timerValidators:number = 0;
let timerCoin:number = 0;
let timerProposals:number = 0;
let timerTransactions: number = 0;
let timerElection: number = 0;

function updatePendingTransactions() {
  Meteor.clearInterval(timerTransactions);
  Meteor.call("transactions.updatePending", (error, result) => {
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
  Meteor.call("chain.updateCoin", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      // console.log("Updated token price " )
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
      // console.log("Updated validators at height: " + number)
    }

    timerValidators = Meteor.setInterval(updateValidators, 30000);
  });
}

// Get blocks from the server until the latest block height.
// Continue checking every 10 seconds.
function updateBlock(number: number) {
  Meteor.call("blocks.getBlocks", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated block height to: " + result);
    }

    timer = Meteor.setInterval(() => {
    Meteor.clearInterval(timer);
      web3.eth.getBlockNumber().then((num) => {
        updateBlock(num);
      });
    }, 10000);
  });
}

function updateElection(number: Number) {
  Meteor.clearInterval(timerElection);
  Meteor.call("election.update", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated election at height " + number );
    }
  })
  timerElection = Meteor.setInterval(updateElection, 450000);
}


// Update chain latest status every 5 seconds.
function updateChainState(number: number) {
  Meteor.call("chain.updateChain", number, (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated chain height to: " + result);
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
  Meteor.call("contract.getContractABI", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated contract ABIs ");
    }
  });
}


function updateProposals() {
  Meteor.clearInterval(timerProposals);
  Meteor.call("proposals.getProposals", (error, result) => {
    if (error) {
      console.log(error);
    }

    if (result) {
      console.log("Updated proposals ");
    }

    timerProposals = Meteor.setInterval(updateProposals, 300000);

  });
}



Meteor.startup(() => {
  // Make sure the chain has block
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
        updateProposals();
        updateElection(number);
      }
    });
  });
});
