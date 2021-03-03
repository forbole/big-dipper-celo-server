import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit';
import { ElectionResultsCache } from '@celo/celocli/lib/utils/election';
import BigNumber from 'bignumber.js';
import Blocks from '../blocks';
import Chain from '../../chain/chain';
import Transactions from '../../transactions/transactions';
import { ValidatorRecords } from '../../validators/validators';

import PUB from '../../graphql/subscriptions';

const kit = newKit(Meteor.settings.public.fornoAddress);
const { web3 } = kit;

interface LatestBlockInterface {
  number?: number;
  timestamp?: number
}

interface RecordInterface {
  blockNumber?: number;
  miner?: string;
  hash?: string;
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

// Query the current Chain status and update with the latest values
const chainStatus = (chainState, block, blockTime, latestBlockHeight, targetHeight) => {
  for (let i = latestBlockHeight + 1; i <= targetHeight; i++) {
    if (chainState) {
      // make sure averageBlockTime and txCount exist before calculation
      if (!chainState.averageBlockTime) chainState.averageBlockTime = 0;
      if (!chainState.txCount) chainState.txCount = 0;

      chainState.averageBlockTime = (chainState.averageBlockTime * (i - 1) + blockTime) / i;
      chainState.latestHeight = block.number;
    } else {
      chainState = {
      };
      chainState.averageBlockTime = 0;
      chainState.txCount = 0;
    }

    chainState.latestHeight = block.number;
  }
};

// Query the transaction hash in each block and save it in Transactions collection
const saveTxDetails = (block, chainState) => {
  // Get transactions hash
  if (block.transactions.length > 0) {
    for (let j = 0; j < block.transactions.length; j++) {
      console.log(`Add pending transaction: ${block.transactions[j]}`);
      const tx = {
        hash: block.transactions[j],
        pending: true,
        blockNumber: block.number,
        blockHash: block.hash,
      };
      if (tx) {
        console.log(`Processing transaction: ${tx.hash}`);
        // Insert tx details
        try {
          Transactions.insert(tx, (error, result) => {
            PUB.pubsub.publish(PUB.TRANSACTION_ADDED, {
              transactionAdded: tx,
            });
          });
        } catch (e) {
          console.log(`Error when processing transaction with hash ${tx.hash} ${e}`);
        }
      }
    }
    chainState.txCount += block.transactions.length;
    return chainState.txCount;
  }
};

Meteor.methods({
  'blocks.getBlocks': async function (targetHeight) {
    this.unblock();
    let latestBlockHeight: number = 0;
    let chainId: number;
    let blockTime = 0;
    let block: BlockInterface;
    let blockchainParams;

    const latestBlock: LatestBlockInterface = Blocks.findOne({
    }, {
      sort: {
        number: -1,
      },
      limit: 1,
    });
    if (latestBlock) {
      latestBlockHeight = latestBlock.number;
    }
    console.log(`Last block in db: ${latestBlockHeight}`);

    try {
      chainId = await web3.eth.net.getId();
    } catch (error) {
      console.log(`Error when getting Chain ID ${error}`);
    }

    try {
      blockchainParams = await kit.contracts.getBlockchainParameters();
    } catch (error) {
      console.log(`Error when getting blockchain params ${error}`);
    }

    let lastBlock: LatestBlockInterface = latestBlock;

    for (let i = latestBlockHeight + 1; i <= targetHeight; i++) {
      console.log(`Processing block: ${i}`);

      try {
        // Get block
        block = await web3.eth.getBlock(i);
      } catch (e) {
        console.log(`Error when getting Block ${i} details ${e}`);
      }

      if (!block) return i;

      if (lastBlock) {
        blockTime = block.timestamp - lastBlock.timestamp;
      }

      const chainState: { [k: string]: any } = Chain.findOne({
        chainId,
      });

      // Calculate block time
      block.blockTime = blockTime;
      // Set initial hasSigners value to false
      block.hasSingers = false;

      try {
        const getGasLimit = await blockchainParams.getBlockGasLimit();
        block.gasLimit = new BigNumber(getGasLimit).toNumber();
      } catch (error) {
        console.log(`Error when getting Gas Limit ${error}`);
      }

      // Update Chain Status
      chainStatus(chainState, block, blockTime, latestBlockHeight, targetHeight);
      // Save latest block tx details
      saveTxDetails(block, chainState);

      Chain.upsert({
        chainId,
      }, {
        $set: chainState,
      });
      Blocks.insert(block, (error, result) => {
        PUB.pubsub.publish(PUB.BLOCK_ADDED, {
          blockAdded: block,
        });
      });

      // Seve the latest height block in lastBlock variable before processing new block height
      lastBlock = block;
    }

    return targetHeight;
  },

  'blocks.getBlockSigners': async function (latestHeight: number) {
    this.unblock();
    let latestBlockHeight: number = 0;
    let epochNumber; let election; let validatorSet; let validators; let epochSize; let
      block;

    const latestBlock: LatestBlockInterface = Blocks.findOne({
    }, {
      sort: {
        number: -1,
      },
      limit: 1,
    });
    if (latestBlock) {
      latestBlockHeight = latestBlock.number;
    }

    for (let i = latestBlockHeight + 1; i <= latestHeight; i++) {
      console.log(`Update signers for block : ${i}`);

      try {
        // Get block
        block = await web3.eth.getBlock(i);
      } catch (e) {
        console.log(`Error when getting Signers Block ${i} details ${e}`);
      }

      if (!block) return i;
      try {
        epochNumber = await kit.getEpochNumberOfBlock(i);
      } catch (e) {
        console.log(`Error when processing Epoch Number ${e}`);
      }

      try {
        election = await kit.contracts.getElection();
      } catch (e) {
        console.log(`Error when processing Election Contract Details ${e}`);
      }

      try {
        validatorSet = await election.getElectedValidators(epochNumber);
      } catch (e) {
        console.log(`Error when processing Elected Validators Set ${e}`);
      }

      try {
        validators = await kit.contracts.getValidators();
      } catch (e) {
        console.log(`Error when processing Validators ${e}`);
      }

      try {
        epochSize = await validators.getEpochSize();
      } catch (e) {
        console.log(`Error when processing Epoch Size ${e}`);
      }

      const electionRC = new ElectionResultsCache(election, epochSize.toNumber());
      try {
        for (const v in validatorSet) {
          if (v) {
            const record: RecordInterface = {
              blockNumber: block.number,
              signer: validatorSet[v].signer,
              miner: block.miner,
              hash: block.hash,
              exist: await electionRC.signedParent(validatorSet[v].signer, block),
            };
            ValidatorRecords.insert(record);
          }
        }
        Blocks.upsert({
          number: block.number,
        }, {
          $set: {
            hasSingers: true,
          },
        });
      } catch (e) {
        console.log(`Error when processing Validator Record ${e}`);
      }
    }
    return latestHeight;
  },

});
