import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit'

import "../imports/startup/server"

const kit = newKit(Meteor.settings.public.fornoAddress);
const web3 = kit.web3;
let timer, timerChain: Number;
timer = 0;
timerChain = 0;

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
            updateBlock(number)
        })
});
