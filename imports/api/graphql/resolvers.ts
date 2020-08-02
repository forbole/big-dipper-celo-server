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
      const totalCounts = Transactions.find({$or:[{to:address},{from:address}]}).count();
      const transactions = Transactions.find(
        {$or:[{to:address},{from:address}]},
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
      account.txCount = Transactions.find({$or:[{from:args.address},{to:args.address}]}).count();
      return account;
    },
    accounts: async (_, { pageSize = 20, page = 1 }, { dataSources }) => {
      const totalCounts = Accounts.find().count();
      const accounts = Accounts.find(
        {},
        {
          sort: { balance: -1 },
          limit: pageSize,
          skip: (page - 1) * pageSize,
        }
      ).fetch();
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
    currentValidatorSet(_, args, context, info){
      let validators = Meteor.call('chain.getCurrentValidatorSet');
      let validatorSet = new Array();
      validators.forEach(validator => {
        validatorSet.push(Validators.findOne({address:validator.address}))
      });

      return validatorSet
    }
  },
  Block: {
    transactions(parent) {
      return Transactions.find({ hash: { $in: parent.transactions } }).fetch();
    },
    miner(parent) {
      return Validators.findOne({ signer: parent.miner });
    },
    signers(parent) {
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
      const signerRecords = ValidatorRecords.rawCollection().aggregate(pipeline).toArray()
      console.log(signerRecords);
      return signerRecords
    }
  },
  Transaction: {
    to(parent) {
        if (parent.value == "0"){
          // it's a contract call
          let contract = Contracts.findOne({ address: parent.to });
          if (contract){
            return {
              _id: contract._id,
              address: parent.to,
              contract: contract
            }
          }
          else{
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
      return ValidatorGroups.findOne({ address: parent.validatorGroup });
    },
    signer(parent) {
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
