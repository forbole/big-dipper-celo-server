import { Meteor } from 'meteor/meteor';
import GraphQLJSON from 'graphql-type-json';
import moment from 'moment';
import numbro from 'numbro';
import fetch from 'node-fetch';
import Chain from '../chain/chain';
import Transactions from '../transactions/transactions';
import Accounts from '../accounts/accounts';
import Blocks from '../blocks/blocks';
import ValidatorGroups from '../validator-groups/validator-groups';
import {
  Validators, ValidatorRecords,
} from '../validators/validators';
import Contracts from '../contracts/contracts';
import Proposals from '../governance/proposals';
import PUB from './subscriptions';
import Election from '../governance/election';

const CELO = 1e18;

interface ContractInterface {
  _id?: string;
}
interface AccountInterface {
  txCount?: number;
  _id?: string;

}

interface AccountsInterface {
  length?: number;
  forEach?(arg0: (account: any) => void);
  txCount?: number;
}

interface BlockInterface {
  push?(block: any);
  length?: number;
  timestamp?: string;
}
interface TxInterface {
  length?: number;
  blockNumber?: number;
}

interface ProposalsInterface {
  length?: number;
  proposalNumber?: number;
}

interface RecordsInterface {
  forEach?(arg0: (record: any) => void);
}

interface CeloTotalInterface {
  celoTotalSupply?: number
}

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
    transactions: async (_, {
      pageSize = 20, page = 1, sortBy = {
        field: 'blockNumber', order: 'DESC',
      },
    }, { dataSources }) => {
      const totalCounts = Transactions.find().count();
      const sortItems = {
      };
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1;
      }
      const transactions: TxInterface = Transactions.find(
        {
        },
        {
          sort: sortItems,
          limit: pageSize,
          skip: (page - 1) * pageSize,
        },
      ).fetch();
      return {
        pageSize,
        page,
        transactions,
        totalCounts,
        cursor: transactions.length
          ? transactions[transactions.length - 1].blockNumber
          : null,
        hasMore: transactions.length === pageSize,
      };
    },
    transaction(_, args, context, info) {
      return Transactions.findOne({
        hash: args.hash,
      });
    },
    transactionsByAccount: async (_, {
      address, pageSize = 20, page = 1,
    }, { dataSources }) => {
      const totalCounts = Transactions.find({
        $or: [{
          to: address,
        }, {
          from: address,
        }],
      }).count();
      const transactions: TxInterface = Transactions.find(
        {
          $or: [{
            to: address,
          }, {
            from: address,
          }],
        },
        {
          sort: {
            blockNumber: -1,
          },
          limit: pageSize,
          skip: (page - 1) * pageSize,
        },
      ).fetch();
      return {
        pageSize,
        page,
        transactions,
        totalCounts,
        cursor: transactions.length
          ? transactions[transactions.length - 1].blockNumber
          : null,
        hasMore: transactions.length === pageSize,
      };
    },
    account(_, args, context, info) {
      const account = Meteor.call('accounts.getAccount', args.address);
      account.txCount = Transactions.find({
        $or: [{
          from: args.address,
        }, {
          to: args.address,
        }],
      }).count();
      return account;
    },
    accounts: async (_, {
      pageSize = 20, page = 1, sortBy = {
        field: 'balance', order: 'DESC',
      },
    }, { dataSources }) => {
      const sortItems = {
      };
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1;
      }

      const totalCounts = Accounts.find({
        balance: {
          $gt: 0,
        },
      }).count();
      const accounts: AccountsInterface = Accounts.find(
        {
          balance: {
            $gt: 0,
          },
        },
        {
          sort: sortItems,
          limit: pageSize,
          skip: (page - 1) * pageSize,
        },
      ).fetch();
      accounts.forEach((account) => {
        account.txCount = Transactions.find({
          $or: [{
            from: account.address,
          }, {
            to: account.address,
          }],
        }).count();
      });
      return {
        pageSize,
        page,
        accounts,
        totalCounts,
        cursor: accounts.length
          ? accounts[accounts.length - 1].address
          : null,
        hasMore: accounts.length === pageSize,
      };
    },
    blocks: async (_, {
      pageSize = 20, page = 1, sortBy = {
        field: 'number', order: 'DESC',
      }, fromBlock = 1,
    }, { dataSources }) => {
      const totalCounts = Blocks.find().count();
      const sortItems = {
      };
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1;
      }

      const blocks: BlockInterface = Blocks.find(
        {
          number: {
            $gte: fromBlock,
          },
        },
        {
          sort: sortItems, limit: pageSize, skip: (page - 1) * pageSize,
        },
      ).fetch();
      return {
        pageSize,
        page,
        blocks,
        totalCounts,
        cursor: blocks.length ? blocks[blocks.length - 1].number : null,
        hasMore: blocks.length ? blocks[blocks.length - 1].number !== 1 : false,
      };
    },
    block(_, args, context, info) {
      return Blocks.findOne({
        number: args.number,
      });
    },
    validatorGroup(_, args, context, info) {
      if (args.valGroupAddress) {
        return ValidatorGroups.findOne({
          address: args.valGroupAddress,
        });
      }
      if (args.name) {
        return ValidatorGroups.findOne({
          name: args.name,
        });
      }
    },

    validatorGroups: async (_, {
      pageSize = 20, page = 1, sortBy = {
        field: 'commission', order: 'DESC',
      },
    }, { dataSources }) => {
      const totalCounts = ValidatorGroups.find().count();
      const sortItems = {
      };
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1;
      }
      const validatorGroups = ValidatorGroups.find(
        {
        },
        {
          sort: sortItems,
          limit: pageSize,
          skip: (page - 1) * pageSize,
        },
      ).fetch();
      return {
        pageSize,
        page,
        validatorGroups,
        totalCounts,
        hasMore: validatorGroups.length === pageSize,
      };
    },

    validator(_, args, context, info) {
      if (args.address) {
        return Validators.findOne({
          address: args.address,
        });
      }
      if (args.name) {
        return Validators.findOne({
          name: args.name,
        });
      }
    },
    currentValidatorSet(_, args, context, info) {
      const validators = Meteor.call('chain.getCurrentValidatorSet');
      const validatorSet = [];
      validators.forEach((validator) => {
        validatorSet.push(Validators.findOne({
          address: validator.address,
        }));
      });

      return validatorSet;
    },

    async coinHistoryByDates(_, {
      dateFrom = '22-08-2020', dateTo = '11-09-2020',
    }, context, info) {
      const celoTotal: CeloTotalInterface = Chain.findOne();
      const fromDate = moment(`${dateFrom} 00:00`, 'DD-MM-YYYY HH:mm').unix();
      const toDate = moment(`${dateTo} 00:00`, 'DD-MM-YYYY HH:mm').unix();
      const url = `https://api.coingecko.com/api/v3/coins/celo/market_chart/range?vs_currency=usd&from=${fromDate}&to=${toDate}`;

      const priceHistory = await fetch(url).then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
        .catch((e) => {
          return console.log(`Error when getting Coin Price History by Dates ${e}`);
        });

      const prices = [];
      for (let c = 0; c < priceHistory?.prices.length; c++) {
        prices[c] = {
          Time: moment(priceHistory?.prices[c][0]).format('DD MMM hh:mm a'),
          CELO: numbro(priceHistory?.prices[c][1]).format('0.0000'),
          Market_Cap: numbro((priceHistory?.prices[c][1] * celoTotal?.celoTotalSupply) / CELO).format('0.0000'),
        };
      }
      const totalVolumes = priceHistory?.total_volumes;

      return {
        prices, totalVolumes,
      };
    },

    async coinHistoryByNumOfDays(_, args, context, info) {
      const celoTotal: CeloTotalInterface = Chain.findOne();
      const url = `https://api.coingecko.com/api/v3/coins/celo/market_chart?vs_currency=usd&days=${args.days}`;

      const priceHistory = await fetch(url)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
        })
        .catch((e) => {
          return console.log(`Error when getting Coin Price History by Number of Days ${e}`);
        });

      const prices = [];
      for (let c = 0; c < priceHistory?.prices.length; c++) {
        prices[c] = {
          Time: moment(priceHistory?.prices[c][0]).format('DD MMM hh:mm a'),
          CELO: numbro(priceHistory?.prices[c][1]).format('0.0000'),
          Market_Cap: numbro((priceHistory?.prices[c][1] * celoTotal?.celoTotalSupply) / CELO).format('0.0000'),
        };
      }
      const totalVolumes = priceHistory?.total_volumes;

      return {
        prices, totalVolumes,
      };
    },

    async downtime(_, {
      address, pageSize = 20, page = 1,
    }, context, info) {
      const totalCounts = ValidatorRecords.find({
        signer: address,
      }).count();
      const pipeline = [
        {
          $match: {
            signer: address,
            exist: false,
          },
        }, {
          $lookup: {
            from: 'blocks',
            localField: 'blockNumber',
            foreignField: 'number',
            as: 'block',
          },
        }, {
          $sort: {
            blockNumber: -1,
          },
        }, {
          $skip: (page - 1) * pageSize,
        }, {
          $limit: pageSize,
        }, {
          $unwind: {
            path: '$block',
          },
        },
      ];

      let records: RecordsInterface;
      try {
        records = await ValidatorRecords.rawCollection().aggregate(pipeline).toArray();
      } catch (error) {
        console.log(`Error when getting Validator Records ${error}`);
      }

      const blocks = [];
      records.forEach((record) => {
        blocks.push(record.block);
      });

      return {
        pageSize,
        page,
        blocks,
        totalCounts,
        cursor: blocks.length ? blocks[blocks.length - 1].number : null,
        hasMore: blocks.length ? blocks[blocks.length - 1].number !== 1 : false,
      };
    },
    proposedBlocks(_, {
      address, pageSize = 20, page = 1,
    }, context, info) {
      const totalCounts = Blocks.find({
        miner: address,
      }).count();
      const blocks: BlockInterface = Blocks.find(
        {
          miner: address,
        },
        {
          sort: {
            number: -1,
          },
          limit: pageSize,
          skip: (page - 1) * pageSize,
        },
      ).fetch();
      return {
        pageSize,
        page,
        blocks,
        totalCounts,
        cursor: blocks.length ? blocks[blocks.length - 1].number : null,
        hasMore: blocks.length ? blocks[blocks.length - 1].number !== 1 : false,
      };
    },

    proposal(_, args, context, info) {
      return Proposals.findOne({
        proposalId: args.proposalNumber,
      });
    },

    proposals: async (_, {
      pageSize = 20, page = 1, sortBy = {
        field: 'proposalId', order: 'DESC',
      },
    }, { dataSources }) => {
      const totalCounts = Proposals.find().count();
      const sortItems = {
      };
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1;
      }
      const proposals: ProposalsInterface = Proposals.find(
        {
        },
        {
          sort: sortItems,
          limit: pageSize,
          skip: (page - 1) * pageSize,
        },
      ).fetch();
      return {
        pageSize,
        page,
        proposals,
        totalCounts,
        cursor: proposals.length
          ? proposals[proposals.length - 1].proposalId
          : null,
        hasMore: proposals.length === pageSize,
      };
    },
    election() {
      return Election.findOne();
    },
    async blockSigners(_, {
      blockNumber, blockHash,
    }, context, info) {
      const pipeline = [
        {
          $match: {
            blockNumber,
            hash: blockHash,
          },
        }, {
          $lookup: {
            from: 'validators',
            localField: 'signer',
            foreignField: 'signer',
            as: 'validators',
          },
        },
      ];

      let signerRecords;
      try {
        signerRecords = await ValidatorRecords.rawCollection().aggregate(pipeline).toArray();
      } catch (error) {
        console.log(`Error when getting Signer Records ${error}`);
      }
      return signerRecords;
    },
  },
  Block: {
    transactions(parent) {
      return Transactions.find({
        hash: {
          $in: parent.transactions,
        },
      }).fetch();
    },
    miner(parent) {
      let miner = Validators.findOne({
        signer: parent.miner,
      });
      if (!miner) {
        miner = {
          address: '',
          name: '',
          affiliation: '',
          blsPublicKey: '',
          ecdsaPublicKey: '',
          score: 0,
          signer: parent.miner,
        };
      }
      return miner;
    },
    async signers(parent) {
      const pipeline = [
        {
          $match: {
            blockNumber: (parent.number),
            hash: parent?.hash,
          },
        }, {
          $lookup: {
            from: 'validators',
            localField: 'signer',
            foreignField: 'signer',
            as: 'validators',
          },
        },
      ];

      let signerRecords;
      try {
        signerRecords = await ValidatorRecords.rawCollection().aggregate(pipeline).toArray();
      } catch (error) {
        console.log(`Error when getting Signer Records ${error}`);
      }
      return signerRecords;
    },
  },
  Transaction: {
    to(parent) {
      if (parent.value === '0') {
        // it's a contract call
        const contract: ContractInterface = Contracts.findOne({
          address: parent.to,
        });
        if (contract) {
          return {
            _id: contract._id,
            address: parent.to,
            contract,
          };
        }

        return {
          address: parent.to,
        };
      }

      // it's a native transfer
      const account: AccountInterface = Accounts.findOne({
        address: parent.to,
      });
      return {
        _id: account._id,
        address: parent.to,
        account,
      };
    },
    from(parent) {
      return Accounts.findOne({
        address: parent.from,
      });
    },
    timestamp(parent) {
      const block: BlockInterface = Blocks.findOne({
        number: parent.blockNumber,
      });
      if (block) {
        return block.timestamp;
      }
    },
  },
  ValidatorGroup: {
    members(parent) {
      return Validators.find({
        address: {
          $in: parent.members,
        },
      }).fetch();
    },
    membersAccount(parent) {
      return Accounts.find({
        address: {
          $in: parent.members,
        },
      }).fetch();
    },
  },
  Validator: {
    validatorGroup(parent) {
      return ValidatorGroups.findOne({
        address: parent.affiliation,
      });
    },
    signerAccount(parent) {
      return Meteor.call('accounts.getAccount', parent.signer);
    },
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
  },
};
