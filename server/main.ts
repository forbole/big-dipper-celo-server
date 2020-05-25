import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit'

import "../imports/startup/server"

const kit = newKit(Meteor.settings.public.fornoAddress);
const web3 = kit.web3;
let timer, timerChain, timerValidators, timerCoin: Number;
timer = 0;
timerChain = 0;
timerValidators = 0;
timerCoin = 0;

function updateTokenPrice(){
    Meteor.clearInterval(timerCoin);
    Meteor.call('chain.updateCoin', (error, result) => {
        if (error) {
            console.log(error);
        }

        if (result) {
            // console.log("Updated block height to: "+number)
        }

        timerCoin = Meteor.setInterval(updateTokenPrice, 30000)
    });
}

function updateValidators(){
    Meteor.clearInterval(timerValidators);
    Meteor.call('validators.update', (error, result) => {
        if (error){
            console.log(error);
        }

        if (result){
            // console.log("Updated block height to: "+number)
        }

        timerValidators = Meteor.setInterval(updateValidators, 10000)
    }) 
}

// Get blocks from the server until the latest block height.
// Continue checking every 10 seconds.
function updateBlock(number:Number) {
    Meteor.clearInterval(timer);
    Meteor.call('blocks.getBlocks', number, (error, result) => {
        if (error){
            console.log(error);
        }

        if (result){
            console.log("Updated block height to: "+number)
        }

        timer = Meteor.setInterval(() => {
            web3.eth.getBlockNumber()
                .then((number) => {
                updateBlock(number)
            })}, 10000)
    })
}

// Update chain latest status every 10 seconds.
function updateChainState(number:Number) {
    Meteor.clearInterval(timerChain);
    Meteor.call('chain.updateChain', number, (error, result) => {
        if (error){
            console.log(error);
        }

        if (result){
            console.log("Updated chain height to: "+number)
        }

        timerChain = Meteor.setInterval(() => {
            web3.eth.getBlockNumber()
                .then((number) => {
                    updateChainState(number)
            })}, 10000)
    })
}

Meteor.startup(() => {
    web3.eth.getBlockNumber()
        .then((number) => {
            updateChainState(number)
            updateValidators()
            updateBlock(number)
            updateTokenPrice()
        })
});
