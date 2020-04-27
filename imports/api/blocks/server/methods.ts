import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit'
import { Blocks } from '../blocks';
import { Chain } from '../../chain/chain'

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
    'blocks.getBlocks': async function(targetHeight){
        console.log(targetHeight)
        this.unblock();
        let latestBlockHeight = 0;
        let latestBlock = Blocks.findOne({},{sort:{number:-1}, limit:1})
        if (latestBlock){
            latestBlockHeight = latestBlock.number;
        }

        console.log("Last block in db: "+latestBlockHeight);

        for (let i = latestBlockHeight+1; i <= 10; i++){
            try{
                let block = await web3.eth.getBlock(i);
                Blocks.insert(block)
    
            }
            catch(e){
                console.log(e);
            }
        }

        return true
    },
})