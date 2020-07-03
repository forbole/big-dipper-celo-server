// create indexes
import { Blocks } from "../../api/blocks/blocks";
import { Accounts } from "../../api/accounts/accounts";
import { Transactions } from "../../api/transactions/transactions";
import { ValidatorGroups } from "../../api/validator-groups/validator-groups";
import { Validators } from "../../api/validators/validators";
import { Contracts } from "../../api/contracts/contracts";

Blocks.rawCollection().createIndex({ number: -1 }, { unique: true });
Accounts.rawCollection().createIndex({ address: 1 }, { unique: true });
Transactions.rawCollection().createIndex({ hash: 1 }, { unique: true });
Transactions.rawCollection().createIndex({ blockNumber: -1 });
Transactions.rawCollection().createIndex({ to: 1 });
Transactions.rawCollection().createIndex({ from: 1 });
ValidatorGroups.rawCollection().createIndex({ address: 1 }, { unique: true });
Validators.rawCollection().createIndex({ address: 1 }, { unique: true });
Contracts.rawCollection().createIndex({ address: 1 }, { unique: true });
