import { Meteor } from 'meteor/meteor';
import { Chain } from '../../chain/chain';
import { newKit } from '@celo/contractkit';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
    'chain.updateChain': async function(height){
        this.unblock();
        let chainId = await web3.eth.net.getId();
        Chain.upsert({chainId:chainId}, {$set:{latestHeight:height}},(error, result) => {
            let chainState = Chain.findOne({chainId:chainId});
            PUB.pubsub.publish(PUB.CHAIN_UPDATED, { chainUpdated: chainState });
        });
    }
})