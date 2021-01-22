import { Meteor } from "meteor/meteor"
import { newKit } from "@celo/contractkit"
import { Blocks } from "../blocks"
import { Chain } from "../../chain/chain"
import { Transactions } from "../../transactions/transactions"
import { ElectionResultsCache } from "@celo/celocli/lib/utils/election"
import { ValidatorRecords } from "../../validators/validators"

import PUB from "../../graphql/subscriptions"

let kit = newKit(Meteor.settings.public.fornoAddress)
let web3 = kit.web3;

interface LatestBlockInterface {
  number?: number;
  timestamp?: number
}

interface RecordInterface {
  blockNumber?: number;
  signer?: string;
  exist?: boolean;
}

interface BlockInterface {
  hasSingers?: boolean
  transactions?: any
  blockTime?: number
  hash: string;
  parentHash: string;
  nonce: any;
  sha3Uncles: any;
  logsBloom: string;
  transactionRoot: string;
  stateRoot: string;
  receiptRoot: string;
  miner: string;
  extraData: string;
  gasLimit: number;
  gasUsed: number;
  timestamp: any;
  number: number;

}
Meteor.methods({
  "blocks.getBlocks": async function (targetHeight) {
    console.log(targetHeight)
    this.unblock();
    let latestBlockHeight = 0;
    let chainId, epochNumber, election, validatorSet, validators, epochSize

    let latestBlock: LatestBlockInterface = Blocks.findOne({}, { sort: { number: -1 }, limit: 1 })
    if (latestBlock) {
      latestBlockHeight = latestBlock.number
    }

    console.log("Last block in db: " + latestBlockHeight)

    try {
      chainId = await web3.eth.net.getId()
    }
    catch (error) {
      console.log("Error when getting Chain ID " + error)
    }
    let lastBlock: LatestBlockInterface = latestBlock;

    for (let i = latestBlockHeight + 1; i <= targetHeight; i++) {
      let blockTime = 0
      let block: BlockInterface;
        console.log("Processing block: " + i)

      try {
        // get block
         block  = await web3.eth.getBlock(i)
       }
      catch (e) {
          console.log("Error when processing Blocks  " + e)
        }

        if (!block) return i

        if (lastBlock) {
          blockTime = block.timestamp - lastBlock.timestamp
        }

        // calculate block time
        block.blockTime = blockTime

        block.hasSingers = false

        let chainState: { [k: string]: any } = Chain.findOne({
          chainId: chainId,
        });

        if (chainState) {

          // make sure averageBlockTime and txCount exist before calculation

          if (!chainState.averageBlockTime) chainState.averageBlockTime = 0
          if (!chainState.txCount) chainState.txCount = 0

          chainState.averageBlockTime = (chainState.averageBlockTime * (i - 1) + blockTime) / i
          chainState.latestHeight = block.number
        } else {
          chainState = {}
          chainState.averageBlockTime = 0
          chainState.txCount = 0
        }

        chainState.latestHeight = block.number


        // get block singer records
        try {
            epochNumber = await kit.getEpochNumberOfBlock(block.number)
        } 
        catch (e) {
            console.log("Error when processing Epoch Number  " + e)
        }

        try {
           election = await kit.contracts.getElection()
        } 
        catch (e) {
            console.log("Error when processing Election Contract Details " + e)
        }

        try {
           validatorSet = await election.getElectedValidators(epochNumber)
        } 
        catch (e) {
            console.log("Error when processing Elected Validators Set  " + e)
        }

        try {
           validators = await kit.contracts.getValidators()
        } 
        catch (e) {
            console.log("Error when processing Validators   " + e)
        }

        try {
           epochSize = await validators.getEpochSize()
        } 
        catch (e) {
            console.log("Error when processing Epoch Size  " + e)
        }

        const electionRC = new ElectionResultsCache(election, epochSize.toNumber())
        try{
          for (let v in validatorSet) {
            let record: RecordInterface = {
              blockNumber: block.number,
              signer: validatorSet[v].signer,
              exist: await electionRC.signedParent(validatorSet[v].signer, block)
            }
            ValidatorRecords.insert(record);
        }
        block.hasSingers = true
        }
        catch(e){
            console.log("Error when processing Validator Record")
        }
          
          
        // get transactions hash
        if (block.transactions.length > 0) {
          for (let j = 0; j < block.transactions.length; j++) {
            console.log("Add pending transaction: " + block.transactions[j])
            let tx = {
              hash: block.transactions[j],
              pending: true,
              blockNumber: block.number,
              blockHash: block.hash,
            };
            if (tx) {
              console.log("Processing transaction: " + tx.hash)
              // insert tx
              try {
                Transactions.insert(tx, (error, result) => {
                  PUB.pubsub.publish(PUB.TRANSACTION_ADDED, {
                    transactionAdded: tx,
                  });
                });
              } catch (e) {
                console.log("Error when processing transactions hash " + e)
              }
            }
          }
          chainState.txCount += block.transactions.length
        }

        Chain.upsert({ chainId: chainId }, { $set: chainState })
        Blocks.insert(block, (error, result) => {
          PUB.pubsub.publish(PUB.BLOCK_ADDED, { blockAdded: block })
        });

        lastBlock = block
     
   
    }

    return targetHeight
  },


});
