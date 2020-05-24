import { gql } from 'apollo-server-express'
import BigInt from "apollo-type-bigint-fix";

const typeDefs = gql`
    scalar BigInt

    type Chain {
        _id: String!
        averageBlockTime: Float
        txCount: Int
        latestHeight: Int
        chainId: Int
        tokenPrice: tokenPrice
    }

    type Subscription {
        blockAdded: Block
        transactionAdded: Transaction
        accountAdded: Account
        chainUpdated: Chain
    }

    type tokenPrice {
        usd: Float!
        usd_market_cap: Float!
        usd_24h_vol: Float!
        usd_24h_change: Float!
        last_updated_at: Int!
    }

    type Block {
        _id: String!
        extraData: String!
        gasLimit: Int
        gasUsed: Int!
        hash: String!
        logsBloom: String!
        miner: String!
        number: Int!
        parentHash: String!
        randomness: Randomness!
        receiptsRoot: String!
        size: Int!
        stateRoot: String!
        timestamp: Int!
        totalDifficulty: String!
        transactions: [Transaction]
        transactionsRoot: String!
        blockTime: Int!
    }

    type Randomness {
        committed: String!
        revealed: String!
    }

    type Transaction {
        _id: String!
        blockHash: String!
        blockNumber: Int!
        from: Account
        gas: Int!
        gasPrice: String!
        feeCurrency: String
        gatewayFeeRecipient: String
        gatewayFee: String!
        hash: String!
        input: String!
        nonce: Int
        to: Account
        transactionIndex: Int!
        value: String!
        v: String!
        r: String!
        s: String!
    }

    type Account {
        _id: String!
        address: String!
        balance: BigInt
    }

    type ValidatorGroup {
        _id: String!
        address: String!
        affiliates: [String]
        commission: Float!
        lastSlashed: Int!
        members: [Validator]
        membersUpdated: Int!
        name: String!
        nextCommission: Float!
        nextCommissionBlock: Int!
        slashingMultiplier: Float!
    }

    type Validator{
        _id: String!
        affiliation: String!
        blsPublicKey: String!
        ecdsaPublicKey: String!
        name: String!
        score: Float!
        signer: String!
        validatorGroup: ValidatorGroup!
    }

    type Query {
        chain: Chain
        accountCount: Int!
        blocks(
            pageSize: Int
            page: Int
        ): BlockList! 
        transactions(
            pageSize: Int
            page: Int
        ): TransactionList!
        accounts: [Account]
        block(number: Int): Block
        transaction(hash: String!): Transaction
        account(address: String!): Account
        validatorGroup(address:String!): ValidatorGroup
        validator(address:String!): Validator
    }

    type BlockList {
        cursor: Int!
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        blocks: [Block]
    }

    type TransactionList {
        cursor: Int!
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        transactions: [Transaction]
    }
`;

export default typeDefs;