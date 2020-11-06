import { gql } from 'apollo-server-express'
import BigInt from "apollo-type-bigint-fix";
import GraphQLJSON from "graphql-type-json";

const typeDefs = gql`
    scalar BigInt
    scalar JSON

    enum Order {
        ASC
        DESC
    }

    input SortBy {
        field: String!
        order: Order!
    }

    type Chain {
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
        epochUpdated: Epoch
    }

    type tokenPrice {
        usd: Float!
        usdMarketCap: Float!
        usd24hVol: Float!
        usd24hChange: Float!
        lastUpdatedAt: Int!
    }

    type Block {
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

    type Proposal{
        proposalNumber: Int
        address: String
        blockHash: String
        blockNumber: Int
        event: String
        executionEpoch: BigInt
        expirationEpoch: BigInt
        logIndex: Int
        minDeposit: BigInt
        proposalEpoch: BigInt
        raw: JSON
        referrendumEpoch: BigInt
        removed: Boolean
        returnValues: JSON
        signature: String
        status: String
        totalVotesList: JSON
        transactionHash: String
        transactionIndex: Int
        upvoteList: JSON
        upvotes: BigInt
        votes: JSON

    }
    
    interface ToWalletObject {
        address: String
    }

    type ToWalletAddress implements ToWalletObject {
        address: String
    }

    type ToWalletAccount implements ToWalletObject {
        address: String
        account: Account
    }

    type ToWalletContract implements ToWalletObject {
        address: String
        contract: Contract!
    }

    type Contract {
        address: String!
        name: String!
        ABI: JSON
    }

    type ValidatorGroup {
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
        lockedGoldAmount: BigInt
        votes: BigInt
        votesAvailable: BigInt
    }

    type Validator{
        address: String!
        affiliation: String!
        blsPublicKey: String!
        ecdsaPublicKey: String!
        name: String!
        score: Float!
        signerAccount: Account
        signer: String!
        validatorGroup: ValidatorGroup
    }

    type CoinHistoryByDates{
        prices: JSON
        market_caps: JSON 
        total_volumes: JSON
    }

    type CoinHistoryByNumOfDays{
        prices: JSON
        total_volumes: JSON
    }

    type Epoch{
        epochNumber: Int!
        epochSize: Int!
        firstBlockNumberForEpoch: Int!
        lastBlockNumberForEpoch: Int!
    }

     type Election{
        electedValidatorGroups: Int!
        electedValidators: Int!
        registeredValidatorGroups: Int!
        registeredValidators: Int!
    }

    type Query {
        chain: Chain
        accountCount: Int!
        blocks(
            pageSize: Int
            page: Int
            sortBy: SortBy
        ): BlockList! 
        transactions(
            pageSize: Int
            page: Int
            sortBy: SortBy
        ): TransactionList!
        accounts(
            pageSize: Int
            page: Int
            sortBy: SortBy
        ): AccountList!
        currentValidatorSet: [Validator]!
        block(number: Int): Block
        transaction(hash: String!): Transaction
        transactionsByAccount(
            address: String!,
            pageSize: Int,
            page: Int
        ): TransactionList
        proposedBlocks(
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
        validatorGroups(
            pageSize: Int
            page: Int
            sortBy: SortBy
        ): ValidatorGroupList!
        validator(address:String!): Validator
        coinHistoryByDates(dateFrom: String, 
            dateTo: String): CoinHistoryByDates
        coinHistoryByNumOfDays(days: Int): CoinHistoryByNumOfDays
        proposal(proposalNumber: Int): Proposal
        proposals(pageSize: Int
            page: Int
            sortBy: SortBy): ProposalList!
        epoch: Epoch
        election: Election

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

    type ProposalList {
        cursor: Int!
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        proposals: [Proposal]
    }

    type ValidatorGroupList{
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        validatorGroups: [ValidatorGroup]
    }
`;

export default typeDefs;
