import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Chain } from '../../chain/chain';
import { newKit } from '@celo/contractkit';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
    'chain.updateChain': async function(height){
        // this.unblock();
        let chainId = await web3.eth.net.getId();
        Chain.upsert({chainId:chainId}, {$set:{latestHeight:height}},(error, result) => {
            let chainState = Chain.findOne({chainId:chainId});
            PUB.pubsub.publish(PUB.CHAIN_UPDATED, { chainUpdated: chainState });
        });
        return height
    },
    'chain.updateCoin': async function(){
        // this.unblock();
        let url = "https://api.coingecko.com/api/v3/simple/price?ids=celo-gold&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true"
        let response = HTTP.get(url);
        try{
            if (response.statusCode == 200){
                let chainId = await web3.eth.net.getId();
                Chain.upsert({ chainId: chainId }, { $set: {tokenPrice: response.data['celo-gold']} }, (error, result) => {
                    let chainState = Chain.findOne({ chainId: chainId });
                    PUB.pubsub.publish(PUB.CHAIN_UPDATED, { chainUpdated: chainState });
                });
            }
        }
        catch(e){
            console.log(e);
        }
    }
})