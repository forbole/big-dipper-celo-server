# CHANGELOG

## [Unreleased]

* Add token total supply to chain state
* Store Epoch number to chain state
* Add `txCount` to `Account` resolver
* Get `accountSummary` on chain and return to `Account` resolver
* Build `Chain`, `Account`, `Transaction`, `Block`, `Validator`, `ValidatorGroup` GraphQL resolvers
* Expose GraphQL endpoint
* Store accounts if the transaction is a `Transfer`
* Decode transaction input with stored ABI
* Store accounts if the transaction has value
* Store ABI of know contracts
* Store all transactions
* Store all blocks