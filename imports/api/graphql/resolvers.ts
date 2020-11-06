import { Meteor } from "meteor/meteor";
import { Chain } from "../chain/chain";
import { Transactions } from "../transactions/transactions";
import { Accounts } from "../accounts/accounts";
import { Blocks } from "../blocks/blocks";
import { ValidatorGroups } from "../validator-groups/validator-groups";
import { Validators, ValidatorRecords } from "../validators/validators";
import { Contracts } from "../contracts/contracts";
import { Epoch } from "../epoch/epoch"
import { Proposals } from "../governance/proposals"
import GraphQLJSON from "graphql-type-json";
import moment from "moment";
import numbro from "numbro";
import PUB from "./subscriptions";
import { Election } from "../governance/election";

const CELO = 1e18;

interface ContractProps {
  _id?: string;
}
interface AccountProps {
  txCount?: number;
  _id?: string;
  
}

interface AccountsProps {
  length?: number;
  forEach?(arg0: (account: any) => void);
  txCount?: number;
}

interface BlockProps {
  push?(block: any);
  length?: number;
  timestamp?: string;
}
interface ContractProps {
  _id?: string;
}

interface TxProps{
  length?: number;
  blockNumber?: number;
}

interface ProposalsProps{
length?: number;
proposalNumber?: number;
}

interface RecordsProps{
  forEach?(arg0: (record: any) => void);
  
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
    transactions: async (_, { pageSize = 20, page = 1, sortBy = { field: "blockNumber", order: 'DESC' } }, { dataSources }) => {
      const totalCounts = Transactions.find().count();
      const sortItems = {}
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1
      }
      const transactions: TxProps = Transactions.find(
        {},
        {
          sort: sortItems,
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
      const transactions: TxProps = Transactions.find(
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
      const account: AccountProps = Meteor.call('accounts.getAccount', args.address);
      account.txCount = Transactions.find({ $or: [{ from: args.address }, { to: args.address }] }).count();
      return account;
    },
    accounts: async (_, { pageSize = 20, page = 1, sortBy = { field: "balance", order: 'DESC' } }, { dataSources }) => {

      const sortItems = {}
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1
      }

      const totalCounts = Accounts.find({ balance: { $gt: 0 } }).count();
      const accounts: AccountsProps = Accounts.find(
        { balance: { $gt: 0 } },
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
    blocks: async (_, { pageSize = 20, page = 1, sortBy = { field: "number", order: 'DESC' } }, { dataSources }) => {
      const totalCounts = Blocks.find().count();
      const sortItems = {}
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1
      }

      const blocks: BlockProps = Blocks.find(
        {},
        { sort: sortItems, limit: pageSize, skip: (page - 1) * pageSize }
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

    validatorGroups: async (_, { pageSize = 20, page = 1, sortBy = { field: "commission", order: 'DESC' } }, { dataSources }) => {
      const totalCounts = ValidatorGroups.find().count();
      const sortItems = {}
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1
      }
      const validatorGroups = ValidatorGroups.find(
        {},
        {
          sort: sortItems,
          limit: pageSize,
          skip: (page - 1) * pageSize,
        }
      ).fetch();
      return {
        pageSize: pageSize,
        page: page,
        validatorGroups,
        totalCounts: totalCounts,
        hasMore: validatorGroups.length == pageSize,
      };
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

    coinHistoryByDates(_, { dateFrom = "22-08-2020", dateTo = "11-09-2020" }, context, info) {

      let celoTotal = Chain.findOne();
      let fromDate = moment(`${dateFrom} 00:00`, "DD-MM-YYYY HH:mm").unix()
      let toDate = moment(`${dateTo} 00:00`, "DD-MM-YYYY HH:mm").unix()

      let url = `https://api.coingecko.com/api/v3/coins/celo-gold/market_chart/range?vs_currency=usd&from=${fromDate}&to=${toDate}`

      let response = HTTP.get(url);
      if (response.statusCode == 200) {
        let data = JSON.parse(response.content)

        let prices = [];
        for (let c = 0; c < data.prices.length; c++) {
          prices[c] = {
            Time: moment(data.prices[c][0]).format("DD MMM hh:mm a"),
            CELO: numbro(data.prices[c][1]).format("0.0000"),
            Market_Cap: numbro((data.prices[c][1] * celoTotal.celoTotalSupply) / CELO).format("0.0000"),
          }
        }
        let total_volumes = data.total_volumes

        return { prices, total_volumes }
      }
    },

    coinHistoryByNumOfDays(_, args, context, info) {

      let celoTotal = Chain.findOne();

      let url = `https://api.coingecko.com/api/v3/coins/celo-gold/market_chart?vs_currency=usd&days=${args.days}`

      let response = HTTP.get(url);
      if (response.statusCode == 200) {
        let data = JSON.parse(response.content)

        let coinPrices = data
        let prices = [];
        for (let c = 0; c < coinPrices.prices.length; c++) {
          prices[c] = {
            Time: moment(coinPrices.prices[c][0]).format("DD MMM hh:mm a"),
            CELO: numbro(coinPrices.prices[c][1]).format("0.0000"),
            Market_Cap: numbro((coinPrices.prices[c][1] * celoTotal.celoTotalSupply) / CELO).format("0.0000"),
          }
        }
        let total_volumes = data.total_volumes

        return { prices, total_volumes }
      }
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
      const records: RecordsProps = await ValidatorRecords.rawCollection().aggregate(pipeline).toArray()

      let blocks: BlockProps = new Array()
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
      const blocks: BlockProps = Blocks.find(
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

    epoch() {
      return Epoch.findOne();
    },

    proposal(_, args, context, info) {
      return Proposals.findOne({ proposalNumber: args.proposalNumber });
    },

    proposals: async (_, { pageSize = 20, page = 1, sortBy = { field: "proposalNumber", order: 'DESC' } }, { dataSources }) => {
      const totalCounts = Proposals.find().count();
      const sortItems = {}
      if (sortBy) {
        sortItems[sortBy.field] = sortBy.order === 'ASC' ? 1 : -1
      }
      const proposals: ProposalsProps = Proposals.find(
        {},
        {
          sort: sortItems,
          limit: pageSize,
          skip: (page - 1) * pageSize,
        }
      ).fetch();
      return {
        pageSize: pageSize,
        page: page,
        proposals,
        totalCounts: totalCounts,
        cursor: proposals.length
          ? proposals[proposals.length - 1].proposalNumber
          : null,
        hasMore: proposals.length == pageSize,
      };
    },
    election() {
      return Election.findOne();
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
        let contract: ContractProps = Contracts.findOne({ address: parent.to });
        if (contract) {
          return {
            // _id: contract._id,
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
        let account: AccountProps = Accounts.findOne({ address: parent.to });
        return {
          // _id: account._id,
          address: parent.to,
          account: account
        }
      }
    },
    from(parent) {
      return Accounts.findOne({ address: parent.from });
    },
    timestamp(parent) {
      let block: BlockProps = Blocks.findOne({ number: parent.blockNumber });
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
