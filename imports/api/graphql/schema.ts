import { gql } from 'apollo-server-express'
import BigInt from "apollo-type-bigint-fix";

const typeDefs = gql`
    scalar BigInt

    type Chain {
        _id: String!
        averageBlockTime: Float
        txCount: Int
    }

    type Block {
        _id: String!
        extraData: String!
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
        from: String!
        gas: Int!
        gasPrice: String!
        feeCurrency: String
        gatewayFeeRecipient: String
        gatewayFee: String!
        hash: String!
        input: String!
        nonce: Int
        to: String!
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

    type Query {
        chain: Chain
        blocks: [Block]
        transactions: [Transaction]
        accounts: [Account]
        block(number: Int): Block
        transaction(hash: String!): Transaction
        account(address: String!): Account
    }

`;

export default typeDefs;