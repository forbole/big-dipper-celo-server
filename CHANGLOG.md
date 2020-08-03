# CHANGELOG

## [Unreleased]

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