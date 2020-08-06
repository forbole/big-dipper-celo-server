import { gql } from 'apollo-server-express'
import BigInt from "apollo-type-bigint-fix";
import GraphQLJSON from "graphql-type-json";

const typeDefs = gql`
    scalar BigInt
    scalar JSON

    type Chain {
        _id: String
        averageBlockTime: Float
        txCount: Int
        latestHeight: Int
        chainId: Int
        tokenPrice: tokenPrice
        walletCount: Int
        epochNumber: Int
        epochSize: Int
        cUSDTotalSupply: BigInt
        celoTotalSupply: BigInt
    }

    type Subscription {
        blockAdded: Block
        transactionAdded: Transaction
        accountAdded: Account
        chainUpdated: Chain
    }

    type tokenPrice {
        usd: Float!
        usdMarketCap: Float!
        usd24hVol: Float!
        usd24hChange: Float!
        lastUpdatedAt: Int!
    }

    type Block {
        _id: String
        extraData: String!
        gasLimit: Int
        gasUsed: Int!
        hash: String!
        logsBloom: String!
        miner: Validator
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
        signers: [SignerRecord]
    }

    type Randomness {
        committed: String!
        revealed: String!
    }
    
    type SignerRecord {
        blockNumber: Int
        signer: String
        exist: Boolean
        validator: Validator
    }

    type Transaction {
        _id: String
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
        decodedInput: JSON
        type: String
        nonce: Int
        to: ToWalletObject!
        transactionIndex: Int
        value: String
        v: String!
        r: String!
        s: String!
        pending: Boolean
        timestamp: Int
    }

    type Account {
        _id: String
        address: String
        balance: BigInt
        totalBalance: TotalBalance
        accountSummary: JSON
        isAccount: Boolean
        isSigner: Boolean
        lockedGold: JSON
        attestation: JSON
        txCount: Int
    }

    type TotalBalance {
        gold: BigInt
        lockedGold: BigInt
        usd: BigInt
        total: BigInt
        pending: BigInt
    }
    interface ToWalletObject {
        address: String
    }

    type ToWalletAddress implements ToWalletObject {
        address: String
    }

    type ToWalletAccount implements ToWalletObject {
        _id: String
        address: String
        account: Account
    }

    type ToWalletContract implements ToWalletObject {
        _id: String
        address: String
        contract: Contract!
    }

    type Contract {
        _id: String!
        address: String!
        name: String!
        ABI: JSON
    }

    type ValidatorGroup {
        _id: String
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
        _id: String
        affiliation: String!
        blsPublicKey: String!
        ecdsaPublicKey: String!
        name: String!
        score: Float!
        signerAccount: Account
        signer: String!
        validatorGroup: ValidatorGroup
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
        accounts(
            pageSize: Int
            page: Int
        ): AccountList!
        currentValidatorSet: [Validator]!
        block(number: Int): Block
        transaction(hash: String!): Transaction
        transactionsByAccount(
            address: String!,
            pageSize: Int,
            page: Int
        ): TransactionList
        validatedBlocks(
            address: String
            pageSize: Int
            page: Int
        ): BlockList!
        downtime(
            address: String
            pageSize: Int
            page: Int
        ): BlockList!
        account(address: String!): Account
        validatorGroup(address:String!): ValidatorGroup
        validator(address:String!): Validator
    }

    type AccountList {
        cursor: Int!
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        accounts: [Account]
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
