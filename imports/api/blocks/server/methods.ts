import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit'
import { Blocks } from '../blocks';
import { Chain } from '../../chain/chain';
import { Accounts } from '../../accounts/accounts';
import { Transactions } from '../../transactions/transactions';

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

        let chainId = await web3.eth.net.getId();
        let lastBlock = latestBlock;

        for (let i = latestBlockHeight+1; i <= targetHeight; i++){
            let blockTime = 0;
            try{
                console.log("Processing block: "+i)
                // get block
                let block:{[k: string]: any} = await web3.eth.getBlock(i);

                if (lastBlock){
                    blockTime = block.timestamp - lastBlock.timestamp
                }
                
                // calculate block time
                block.blockTime = blockTime;
                
                let chainState:{[k: string]: any} = Chain.findOne({chainId:chainId})

                if (chainState) {
                    chainState.averageBlockTime = (chainState.averageBlockTime * (i-1) + blockTime) / i;
                }
                else{
                    chainState = {}
                    chainState.averageBlockTime = 0;
                    chainState.txCount = 0;
                }

                // get transactions
                if (block.transactions.length > 0){
                    // console.log("block: "+i);
                    // console.log(block.transactions);
                    // let addresses = {};
                    for(let j = 0; j < block.transactions.length; j++) {
                        let tx = await web3.eth.getTransaction(block.transactions[j])
                        // console.log(tx);
                        console.log("Processing transaction: "+tx.hash);
                        // insert tx
                        try{
                            Transactions.insert(tx);
                            if (parseInt(tx.value) > 0) {
                                let balance = await web3.eth.getBalance(tx.to)
                                if (parseInt(balance) > 0){
                                    // update or insert address if balance larger than 0
                                    Accounts.upsert({address:tx.to}, {$set:{address:tx.to, balance:parseInt(balance)}})
                                }
                            }    
                        }
                        catch(e){
                            console.log(e)
                        }
                    }
                    chainState.txCount += block.transactions.length
                }

                // console.log(chainState)
                Chain.upsert({chainId:chainId}, {$set:chainState});
                Blocks.insert(block);

                lastBlock = block;
            }
            catch(e){
                console.log(e);
            }
        }

        return true
    },
})