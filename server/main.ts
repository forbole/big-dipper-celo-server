import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit'

import "../imports/startup/server"

const kit = newKit(Meteor.settings.public.fornoAddress);
const web3 = kit.web3;
let timer: Number;
timer = 0;

function updateBlock(number:Number) {
    Meteor.clearInterval(timer);
    Meteor.call('blocks.getBlocks', number, (error, result) => {
        if (error){
        }

        if (result){
            
        }
        timer = Meteor.setInterval(() => {
            web3.eth.getBlockNumber()
                .then((number) => {
                updateBlock(number)
            })}, 10000)
    })
}

Meteor.startup(() => {

    web3.eth.getBlockNumber()
        .then((number) => {
            updateBlock(number)
        })
});
