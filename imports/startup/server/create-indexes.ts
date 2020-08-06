// create indexes
import { Blocks } from "../../api/blocks/blocks";
import { Accounts } from "../../api/accounts/accounts";
import { Transactions } from "../../api/transactions/transactions";
import { ValidatorGroups } from "../../api/validator-groups/validator-groups";
import { Validators, ValidatorRecords } from "../../api/validators/validators";
import { Contracts } from "../../api/contracts/contracts";

Blocks.rawCollection().createIndex({ number: -1 }, { unique: true });
Blocks.rawCollection().createIndex({ miner: 1 });
Blocks.rawCollection().createIndex({ number: -1, miner: 1 });
Accounts.rawCollection().createIndex({ address: 1 }, { unique: true });
Transactions.rawCollection().createIndex({ hash: 1 }, { unique: true });
Transactions.rawCollection().createIndex({ blockNumber: -1 });
Transactions.rawCollection().createIndex({ to: 1 });
Transactions.rawCollection().createIndex({ from: 1 });
ValidatorGroups.rawCollection().createIndex({ address: 1 }, { unique: true });
Validators.rawCollection().createIndex({ address: 1 }, { unique: true });
ValidatorRecords.rawCollection().createIndex({blockNumber:-1, signer: 1}, {unique: true});
ValidatorRecords.rawCollection().createIndex({blockNumber:-1});
ValidatorRecords.rawCollection().createIndex({signer: 1});
ValidatorRecords.rawCollection().createIndex({exist:1});
Contracts.rawCollection().createIndex({ address: 1 }, { unique: true });
