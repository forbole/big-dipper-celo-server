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
    // this.unblock();
    let latestBlockHeight = 0;
    let chainId;
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
      try {
        console.log("Processing block: " + i)
        // get block
        let block: BlockInterface = await web3.eth.getBlock(i)

        if (!block) return i

        // console.log(block);
        if (lastBlock) {
          // console.log(block);
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
          // const epochNumber = await kit.getEpochNumberOfBlock(block.number)
          // const election = await kit.contracts.getElection()
          // const validatorSet = await election.getElectedValidators(epochNumber)
          // const validators = await kit.contracts.getValidators()
          // const epochSize = await validators.getEpochSize()
          // console.log(validatorSet)

          // const electionRC = new ElectionResultsCache(election, epochSize.toNumber())
          // for (let v in validatorSet) {
          //   let record: RecordInterface = {
          //     blockNumber: block.number,
          //     signer: validatorSet[v].signer,
          //     exist: await electionRC.signedParent(validatorSet[v].signer, block)
          //   }
          //   ValidatorRecords.insert(record);
          // }
          block.hasSingers = false
          // const blockExtraData = parseBlockExtraData(block.extraData);
          // console.log(blockExtraData);



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

        // console.log(chainState)
        Chain.upsert({ chainId: chainId }, { $set: chainState })
        Blocks.insert(block, (error, result) => {
          PUB.pubsub.publish(PUB.BLOCK_ADDED, { blockAdded: block })
        });

        lastBlock = block
      }
        catch (e) {
          console.log("Error when processing Blocks  " + e)
        } 
    }
      catch (e) {
        console.log("Error when processing Blocks  " + e)
      }
     
   

    return targetHeight
    }
  
  },
})
