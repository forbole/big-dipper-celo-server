import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit'

import "../imports/startup/server"

let timer = 0;

Meteor.startup(() => {
    let kit = newKit(Meteor.settings.public.fornoAddress);
    let web3 = kit.web3;
    web3.eth.getBlockNumber()
        .then((number) => {
            Meteor.call('blocks.getBlocks', number, (error, result) => {
                if (error){
                }

                if (result){
                }
            })
        })
});
