import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit'
import { Blocks } from '../blocks';
import { Chain } from '../../chain/chain';
import { Transactions } from '../../transactions/transactions';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
    'blocks.getBlocks': async function(targetHeight){
        console.log(targetHeight)
        // this.unblock();
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
                
                if (!block) return i;

                // console.log(block);
                if (lastBlock){
                    // console.log(block);
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
                    for(let j = 0; j < block.transactions.length; j++) {
                        let tx:{[k: string]: any} = await web3.eth.getTransaction(block.transactions[j])
                        // console.log(tx);
                        if (tx) {
                            console.log("Processing transaction: "+tx.hash);
                            // insert tx
                            try{
                                tx.pending = false;
                                Transactions.insert(tx, (error, result) => {
                                    PUB.pubsub.publish(PUB.TRANSACTION_ADDED, { transactionAdded: tx });
                                });
                                if (parseInt(tx.value) > 0) {
                                    Meteor.call('accounts.update', tx.to, (error, result) => {
                                        if (error){
                                            console.log(error)
                                        }
                                        if (result){
                                            console.log(result)
                                        }
                                    })
                                }    
                            }
                            catch(e){
                                console.log(e)
                            }
                        }
                        else {
                            console.log("Add pending transaction: "+block.transactions[j]);
                            tx = {hash:block.transactions[j], pending:true, blockNumber:block.number, blockHash:block.hash}
                            Transactions.insert(tx, (error, result) => {
                                PUB.pubsub.publish(PUB.TRANSACTION_ADDED, { transactionAdded: tx });
                            })
                        }
                    }
                    chainState.txCount += block.transactions.length
                }

                // console.log(chainState)
                Chain.upsert({chainId:chainId}, {$set:chainState});
                Blocks.insert(block, (error, result) => {
                    PUB.pubsub.publish(PUB.BLOCK_ADDED, { blockAdded: block });
                });

                lastBlock = block;
            }
            catch(e){
                console.log(e);
            }
        }

        return targetHeight
    },
})