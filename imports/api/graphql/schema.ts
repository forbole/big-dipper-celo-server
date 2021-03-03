import { gql } from 'apollo-server-express';

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

    type Chain @cacheControl(maxAge: 240){
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
        firstBlockNumberForEpoch: Int
        lastBlockNumberForEpoch: Int
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

    type Block @cacheControl(maxAge: 240){
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
        transactions: [Transaction] @cacheControl(maxAge: 30)
        transactionsRoot: String!
        blockTime: Int!
        signers: [SignerRecord] @cacheControl(maxAge: 30)
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

    type Transaction @cacheControl(maxAge: 240){
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

    type Account @cacheControl(maxAge: 240){
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
        groupsVotedFor: JSON
    }

    type TotalBalance {
        gold: BigInt
        lockedGold: BigInt
        usd: BigInt
        total: BigInt
        pending: BigInt
    }

    type Proposal @cacheControl(maxAge: 240){
        _id: String
        proposalId: Int
        address: String
        blockHash: String
        blockNumber: Int
        event: String
        input: JSON
        logIndex: Int
        minDeposit: BigInt
        raw: JSON
        removed: Boolean
        returnValues: JSON
        signature: String
        stage: String
        status: String
        totalVotesList: JSON
        transactionHash: String
        transactionIndex: Int
        upvoteList: JSON
        upvotes: BigInt
        votes: JSON
        submittedTime: Int
        approvalPhaseTime: Int
        votingPhaseStartTime: Int 
        votingPhaseEndTime: Int
        executionPhaseStartTime: Int
        executionPhaseEndTime: Int


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

    type ValidatorGroup @cacheControl(maxAge: 240) {
        _id: String
        address: String!
        affiliates: [String]
        commission: Float!
        lastSlashed: Int!
        members: [Validator]
        membersAccount: [Account]
        membersUpdated: Int!
        name: String!
        nextCommission: Float!
        nextCommissionBlock: Int!
        slashingMultiplier: Float!
        lockedGoldAmount: BigInt
        votes: BigInt
        votesAvailable: BigInt
        electedValidators: JSON
        rewards: JSON
    }

    type Validator @cacheControl(maxAge: 240){
        _id: String
        address: String!
        affiliation: String!
        blsPublicKey: String!
        ecdsaPublicKey: String!
        name: String!
        score: Float!
        attestationCompleted: Int!
        attestationRequested: Int!
        signerAccount: Account
        signer: String!
        validatorGroup: ValidatorGroup
    }

    type CoinHistoryByDates @cacheControl(maxAge: 240){
        prices: JSON
        market_caps: JSON 
        total_volumes: JSON
    }

    type CoinHistoryByNumOfDays @cacheControl(maxAge: 240){
        prices: JSON
        total_volumes: JSON
    }


     type Election @cacheControl(maxAge: 240){
        electedValidatorGroups: Int!
        electedValidators: Int!
        registeredValidatorGroups: Int!
        registeredValidators: Int!
    }

    type Query {
        chain: Chain @cacheControl(maxAge: 10)
        accountCount: Int!
        blocks(
            pageSize: Int
            page: Int
            sortBy: SortBy
            fromBlock: Int
        ): BlockList! @cacheControl(maxAge: 10)
        transactions(
            pageSize: Int
            page: Int
            sortBy: SortBy
        ): TransactionList! @cacheControl(maxAge: 10)
        accounts(
            pageSize: Int
            page: Int
            sortBy: SortBy
        ): AccountList! @cacheControl(maxAge: 10)
        currentValidatorSet: [Validator]! @cacheControl(maxAge: 10)
        block(number: Int): Block @cacheControl(maxAge: 10)
        transaction(hash: String!): Transaction @cacheControl(maxAge: 10)
        transactionsByAccount(
            address: String!,
            pageSize: Int,
            page: Int
        ): TransactionList @cacheControl(maxAge: 10)
        proposedBlocks(
            address: String
            pageSize: Int
            page: Int
        ): BlockList! @cacheControl(maxAge: 10)
        downtime(
            address: String
            pageSize: Int
            page: Int
        ): BlockList! @cacheControl(maxAge: 10)
        account(address: String!): Account @cacheControl(maxAge: 10)
        validatorGroup(valGroupAddress:String name:String): ValidatorGroup @cacheControl(maxAge: 10)
        validatorGroups(
            pageSize: Int
            page: Int
            sortBy: SortBy
        ): ValidatorGroupList! @cacheControl(maxAge: 10)
        validator(address:String name:String): Validator @cacheControl(maxAge: 10)
        coinHistoryByDates(dateFrom: String 
            dateTo: String): CoinHistoryByDates @cacheControl(maxAge: 10)
        coinHistoryByNumOfDays(days: Int): CoinHistoryByNumOfDays @cacheControl(maxAge: 10)
        proposal(proposalNumber: Int): Proposal @cacheControl(maxAge: 10)
        proposals(pageSize: Int
            page: Int
            sortBy: SortBy): ProposalList! @cacheControl(maxAge: 10)
        election: Election @cacheControl(maxAge: 10)

    }

    type AccountList @cacheControl(maxAge: 240) {
        cursor: Int!
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        accounts: [Account]
    }

    type BlockList @cacheControl(maxAge: 240) {
        cursor: Int!
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        blocks: [Block]
    }

    type TransactionList @cacheControl(maxAge: 240) {
        cursor: Int!
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        transactions: [Transaction]
    }

    type ProposalList @cacheControl(maxAge: 240){
        cursor: Int!
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        proposals: [Proposal]
    }

    type ValidatorGroupList @cacheControl(maxAge: 240){
        pageSize: Int!
        page: Int!
        totalCounts: Int!
        hasMore: Boolean!
        validatorGroups: [ValidatorGroup]
    }
`;

export default typeDefs;
