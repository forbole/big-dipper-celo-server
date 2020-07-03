import { Chain } from "../chain/chain";
import { Transactions } from "../transactions/transactions";
import { Accounts } from "../accounts/accounts";
import { Blocks } from "../blocks/blocks";
import { ValidatorGroups } from "../validator-groups/validator-groups";
import { Validators } from "../validators/validators";

import PUB from "./subscriptions";

export default {
  Subscription: {
    chainUpdated: {
      subscribe: () => PUB.pubsub.asyncIterator([PUB.CHAIN_UPDATED]),
    },
    blockAdded: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => PUB.pubsub.asyncIterator([PUB.BLOCK_ADDED]),
    },
    transactionAdded: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => PUB.pubsub.asyncIterator([PUB.TRANSACTION_ADDED]),
    },
    accountAdded: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => PUB.pubsub.asyncIterator([PUB.ACCOUNT_ADDED]),
    },
  },
  Query: {
    chain() {
      return Chain.findOne();
    },
    accountCount(_, args, context, info) {
      return Accounts.find().count();
    },
    transactions: async (_, { pageSize = 20, page = 1 }, { dataSources }) => {
      const totalCounts = Transactions.find().count();
      const transactions = Transactions.find(
        {},
        {
          sort: { blockNumber: -1 },
          limit: pageSize,
          page: (page - 1) * pageSize,
        }
      ).fetch();
      return {
        pageSize: pageSize,
        page: page,
        transactions,
        totalCounts: totalCounts,
        cursor: transactions.length
          ? transactions[transactions.length - 1].blockNumber
          : null,
        hasMore: transactions.length == pageSize,
      };
    },
    transaction(_, args, context, info) {
      return Transactions.findOne({ hash: args.hash });
    },
    account(_, args, context, info) {
      return Accounts.findOne({ address: args.address });
    },
    blocks: async (_, { pageSize = 20, page = 1 }, { dataSources }) => {
      const totalCounts = Blocks.find().count();
      const blocks = Blocks.find(
        {},
        { sort: { number: -1 }, limit: pageSize, page: (page - 1) * pageSize }
      ).fetch();
      return {
        pageSize: pageSize,
        page: page,
        blocks,
        totalCounts: totalCounts,
        cursor: blocks.length ? blocks[blocks.length - 1].number : null,
        hasMore: blocks.length ? blocks[blocks.length - 1].number != 1 : false,
      };
    },
    block(_, args, context, info) {
      return Blocks.findOne({ number: args.number });
    },
    validatorGroup(_, args, context, info) {
      return ValidatorGroups.findOne({ address: args.address });
    },
    validator(_, args, context, info) {
      return Validators.findOne({ address: args.address });
    },
  },
  Block: {
    transactions(parent) {
      return Transactions.find({ hash: { $in: parent.transactions } }).fetch();
    },
    miner(parent) {
      return Validators.findOne({ signer: parent.miner });
    },
  },
  Transaction: {
    async to(parent) {
      try{
        const temp = await Accounts.findOne({ address: parent.to });
        console.log("==============1==================");
        console.log(parent.to);
        console.log(temp);
        console.log("==============2==================");

        return temp;
      }
      catch(e){
        console.log(e);
      }
      
    },
    from(parent) {
      let temp = Accounts.findOne({ address: parent.from });
      // console.log("==============4==================");
      // console.log(parent.from);
      // console.log(temp);
      // console.log("==============5==================");

      return temp;
      console.log(parent.from);
      return Accounts.findOne({ address: parent.from });
    },
    timestamp(parent) {
      let block = Blocks.findOne({ number: parent.blockNumber });
      if (block) {
        return block.timestamp;
      }
    },
  },
  ValidatorGroup: {
    members(parent) {
      return Validators.find({ address: { $in: parent.members } }).fetch();
    },
  },
  Validator: {
    validatorGroup(parent) {
      return ValidatorGroups.findOne({ address: parent.validatorGroup });
    },
  },
};
