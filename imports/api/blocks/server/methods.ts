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

Meteor.methods({
  "blocks.getBlocks": async function (targetHeight) {
    console.log(targetHeight)
    // this.unblock();
    let latestBlockHeight = 0
    let latestBlock = Blocks.findOne({}, { sort: { number: -1 }, limit: 1 })
    if (latestBlock) {
      latestBlockHeight = latestBlock.number
    }

    console.log("Last block in db: " + latestBlockHeight)

    let chainId = await web3.eth.net.getId()
    let lastBlock = latestBlock

    for (let i = latestBlockHeight + 1; i <= targetHeight; i++) {
      let blockTime = 0
      try {
        console.log("Processing block: " + i)
        // get block
        let block: { [k: string]: any } = await web3.eth.getBlock(i)

        if (!block) return i

        // console.log(block);
        if (lastBlock) {
          // console.log(block);
          blockTime = block.timestamp - lastBlock.timestamp
        }

        // calculate block time
        block.blockTime = blockTime

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
        const bulkValidatorRecords = ValidatorRecords.rawCollection().initializeUnorderedBulkOp();

        kit.getEpochNumberOfBlock(block.number)
        .then(async (epochNumber) => {
          kit.contracts.getElection()
          .then(async (election) => {
            election.getElectedValidators(epochNumber)
            .then(async (validatorSet) => {
              const validators = await kit.contracts.getValidators()
              const epochSize = await validators.getEpochSize()
              const electionRC = new ElectionResultsCache(election, epochSize.toNumber())
              for (let v in validatorSet){
                electionRC.signedParent(validatorSet[v].signer, block)
                .then(async (exist) => {
                  let record:any = {
                    blockNumber: block.number,
                    signer: validatorSet[v].signer,
                    exist: exist 
                  }
                  ValidatorRecords.insert(record)
                })
                .catch((reason)=>{
                  console.log("Getting signed parent: %o", reason)
                })
              }
            })
            .catch((reason)=>{
              console.log("Getting elected validators: %o", reason)
            })
          })
          .catch((reason)=>{
            console.log("Getting election contract: %o", reason)
          })
        })
        .catch((reason)=>{
          console.log("Getting epoch number: %o", reason)
        })
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
                console.log(e)
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
      } catch (e) {
        console.log(e)
      }
    }

    return targetHeight
  },
});
