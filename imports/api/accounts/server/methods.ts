import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit'
import { Accounts } from '../../accounts/accounts';
import { Chain } from '../../chain/chain';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
    'accounts.update': async function(address){
        console.log('Update wallet address: '+address)
        let balance = await web3.eth.getBalance(address)
        if (parseInt(balance) > 0){
            // update or insert address if balance larger than 0
            Accounts.upsert({address:address}, {$set:{address:address, balance:parseInt(balance)}}, (error, result) => {
                PUB.pubsub.publish(PUB.ACCOUNT_ADDED, { accountAdded: {address:address, balance:balance} });
            })
        }
    }
})