# CHANGELOG

## [UNRELEASED]
* Implemented CoinHistoryByDates, CoinHistoryByNumOfDays in Schema and Resolvers
* Implemented ValidatorGroups query in schema and resolvers
* Stored total number of elected validators
* Fixed 'totalBlance' to 'totalBalance' typo
* Implemented `Proposal` and `Proposals` GraphQL schema and resolvers that to query list of proposals or individual proposal details 
* Stored Epoch info, built resolvers and schema
* [#59] Stored Elected Validators & Elected Validator Groups info and implemented schema and resolvers

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