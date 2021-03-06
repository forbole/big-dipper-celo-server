# CHANGELOG
## [UNRELEASED]
* Updated Meteor to v2.2
* Updated npm packages to the latest version

## [v0.1.4]
* Implemented CoinHistoryByDates, CoinHistoryByNumOfDays in Schema and Resolvers
* Implemented ValidatorGroups query in schema and resolvers
* Stored total number of elected validators
* Fixed 'totalBlance' to 'totalBalance' typo
* Implemented `Proposal` and `Proposals` GraphQL schema and resolvers that to query list of proposals or individual proposal details 
* Stored Epoch info, built resolvers and schema
* [#59] Stored Elected Validators & Elected Validator Groups info and implemented schema and resolvers
* Added `electedValidators` & `membersAccount` to `ValidatorGroup` query
* Added `try-catch` blocks for async methods, added Interfaces and fixed undefined errors 
* Added `fromBlock` to block query
* [#43] Added validators rewards and attestations 
* Added `groupsVotedFor` in resolvers and schema
* Hidden validators signature in blocks 
* [#70] Removed `getAccountSummary` call causing overflow error and replaced it with `getAccountTotalLockedGold` and `getAccountNonvotingLockedGold` calls
* Moved `firstBlockNumberForEpoch` & `lastBlockNumberForEpoch` calls to `chain.updateChain` method
* Added back validators signatures in blocks 
* Added async function `getBlockSignersRecords` to store validators signatures
* [#71] Added `input params (descriptionURL)`, `votingPhaseTime`, `executionPhaseTime` info to proposals stored in db and fixed error showing empty data on some proposals
* [#75] Moved code logic into separate functions
* Added upvotes timestamp 
* Updated README.md
* Added `try-catch` block when querying the coin price
* [#82] Replaced `HTTP` package in Meteor with `fetch` package
* Updated blocks `gasLimit` value
* [#86] Downgraded Meteor 2.0 to Meteor 1.12
* Updated `averageBlockTime` value
* Added `blocks.getBlockSigners` method
* Added `Referendum` and `Execution` to Proposal Stage
* Updated `@celo` npm packages to `v1.0.1`
* Updated Meteor to `v2.0` 
* [#94] Updated CoinGecko coin name from `celo-gold` to `celo`
* Removed `lastEpochNumber` value
* [#88] Indexed signer field in resolvers to improve aggregation performance
* [#99] Added `ESLint` 
* Implemented `blockSigners` and `blocksSignedByAddress` in schema/resolvers and added `hasActivatablePendingVotes` value to account. 
* Updated `electedValidators` values
* Added `fromBlock` prop to `blockSigners` in resolvers
* Added `decodeTransactionReceipt` method in transactions 
* Updated `getAccountSummary` query for Validators and Validator Groups


## [v0.1.3]
* Added validator address in the schema
* Added Ordering with `SortBy` Option in accounts query


## [v0.1.2]

* [#45] Fixed accounts list resolver
* Return validator downtime blocks in resolver
* Return validator proposed blocks in resolver
* Make `validatorGroup` in `Validator` schema not mandatory

## v0.1.1

* Temporally disabled indexing validator uptime
* Update validator indexing method

## First Release v0.1.0

* Index validators directly instead of reading from validator groups
* [#37] Return a list of signers in block resolver
* Save contract bytecode
* [#35] Track the validators signature existance in blocks 
* Store contract ABI from `contractKit` generated ABI
* [#28] Provide resolver returning transaction list by querying account address
* [#26] Add token total supply to chain state
* [#20] Store Epoch number to chain state
* [#24] Add `txCount` to `Account` resolver
* Get `accountSummary` on chain and return to `Account` resolver
* Build `Chain`, `Account`, `Transaction`, `Block`, `Validator`, `ValidatorGroup` GraphQL resolvers
* Expose GraphQL endpoint
* Store accounts if the transaction is a `Transfer`
* Decode transaction input with stored ABI
* Store accounts if the transaction has value
* Store ABI of know contracts
* Store all transactions
* Store all blocks