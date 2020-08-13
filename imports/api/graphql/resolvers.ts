import { Meteor } from "meteor/meteor";
import { Chain } from "../chain/chain";
import { Transactions } from "../transactions/transactions";
import { Accounts } from "../accounts/accounts";
import { Blocks } from "../blocks/blocks";
import { ValidatorGroups } from "../validator-groups/validator-groups";
import { Validators, ValidatorRecords } from "../validators/validators";
import { Contracts } from "../contracts/contracts";
import GraphQLJSON from "graphql-type-json";

import PUB from "./subscriptions";

export default {
  JSON: GraphQLJSON,
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
          skip: (page - 1) * pageSize,
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
    transactionsByAccount: async (_, { address, pageSize = 20, page = 1 }, { dataSources }) => {
      const totalCounts = Transactions.find({ $or: [{ to: address }, { from: address }] }).count();
      const transactions = Transactions.find(
        { $or: [{ to: address }, { from: address }] },
        {
          sort: { blockNumber: -1 },
          limit: pageSize,
          skip: (page - 1) * pageSize,
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
    account(_, args, context, info) {
      const account = Meteor.call('accounts.getAccount', args.address);
      account.txCount = Transactions.find({ $or: [{ from: args.address }, { to: args.address }] }).count();
      return account;
    },
    accounts: async (_, { pageSize = 20, page = 1, sortBy = { field: "balance", order: 'DESC' } }, { dataSources }) => {

      const sortItems = {}
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1
      }

      const totalCounts = Accounts.find({balance: {$gt: 0}}).count();
      const accounts = Accounts.find(
        {balance: {$gt: 0}},
        {
          sort: sortItems,
          limit: pageSize,
          skip: (page - 1) * pageSize,
        }
      ).fetch();
      accounts.forEach((account) => {
        account.txCount = Transactions.find({ $or: [{ from: account.address }, { to: account.address }] }).count();
      })
      return {
        pageSize: pageSize,
        page: page,
        accounts,
        totalCounts: totalCounts,
        cursor: accounts.length
          ? accounts[accounts.length - 1].address
          : null,
        hasMore: accounts.length == pageSize,
      };
    },
    blocks: async (_, { pageSize = 20, page = 1 }, { dataSources }) => {
      const totalCounts = Blocks.find().count();
      const blocks = Blocks.find(
        {},
        { sort: { number: -1 }, limit: pageSize, skip: (page - 1) * pageSize }
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
    currentValidatorSet(_, args, context, info) {
      let validators = Meteor.call('chain.getCurrentValidatorSet');
      let validatorSet = new Array();
      validators.forEach(validator => {
        validatorSet.push(Validators.findOne({ address: validator.address }))
      });

      return validatorSet
    },
    async downtime(_, { address, pageSize = 20, page = 1 }, context, info) {
      const totalCounts = ValidatorRecords.find({ signer: address }).count();
      const pipeline = [
        {
          '$match': {
            'signer': address,
            'exist': false
          }
        }, {
          '$lookup': {
            'from': 'blocks',
            'localField': 'blockNumber',
            'foreignField': 'number',
            'as': 'block'
          }
        }, {
          '$sort': {
            'blockNumber': -1
          }
        }, {
          '$skip': (page - 1) * pageSize
        }, {
          '$limit': pageSize
        }, {
          '$unwind': {
            'path': '$block'
          }
        }
      ]
      const records = await ValidatorRecords.rawCollection().aggregate(pipeline).toArray()

      let blocks = new Array()
      records.forEach(record => {
        blocks.push(record.block)
      });

      return {
        pageSize: pageSize,
        page: page,
        blocks,
        totalCounts: totalCounts,
        cursor: blocks.length ? blocks[blocks.length - 1].number : null,
        hasMore: blocks.length ? blocks[blocks.length - 1].number != 1 : false,
      };
    },
    proposedBlocks(_, { address, pageSize = 20, page = 1 }, context, info) {
      const totalCounts = Blocks.find({ miner: address }).count()
      const blocks = Blocks.find(
        { miner: address },
        { sort: { number: -1 }, limit: pageSize, skip: (page - 1) * pageSize }
      ).fetch()
      return {
        pageSize: pageSize,
        page: page,
        blocks,
        totalCounts: totalCounts,
        cursor: blocks.length ? blocks[blocks.length - 1].number : null,
        hasMore: blocks.length ? blocks[blocks.length - 1].number != 1 : false,
      };
    },
  },
  Block: {
    transactions(parent) {
      return Transactions.find({ hash: { $in: parent.transactions } }).fetch();
    },
    miner(parent) {
      let miner = Validators.findOne({ signer: parent.miner })
      if (!miner)
        miner = {
          address: "",
          name: "",
          affiliation: "",
          blsPublicKey: "",
          ecdsaPublicKey: "",
          score: 0,
          signer: parent.miner
        }
      return miner
    },
    async signers(parent) {
      const pipeline = [
        {
          '$match': {
            'blockNumber': parent.number
          }
        }, {
          '$lookup': {
            'from': 'validators',
            'localField': 'signer',
            'foreignField': 'signer',
            'as': 'validator'
          }
        }, {
          '$unwind': {
            'path': '$validator'
          }
        }
      ]
      const signerRecords = await ValidatorRecords.rawCollection().aggregate(pipeline).toArray()
      // console.log(signerRecords);
      return signerRecords
    }
  },
  Transaction: {
    to(parent) {
      if (parent.value == "0") {
        // it's a contract call
        let contract = Contracts.findOne({ address: parent.to });
        if (contract) {
          return {
            _id: contract._id,
            address: parent.to,
            contract: contract
          }
        }
        else {
          return {
            address: parent.to
          }
        }
      }
      else {
        // it's a native transfer
        let account = Accounts.findOne({ address: parent.to });
        return {
          _id: account._id,
          address: parent.to,
          account: account
        }
      }
    },
    from(parent) {
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
      return ValidatorGroups.findOne({ address: parent.affiliation });
    },
    signerAccount(parent) {
      console.log(parent.signer);
      return Meteor.call('accounts.getAccount', parent.signer);
    }
  },
  ToWalletObject: {
    __resolveType(obj, context, info) {
      if (obj.contract) {
        return 'ToWalletContract';
      }

      if (obj.account) {
        return 'ToWalletAccount';
      }

      return 'ToWalletAddress';
    },
  }
};
