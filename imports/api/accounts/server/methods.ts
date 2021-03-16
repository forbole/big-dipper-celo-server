import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit';
import Accounts from '../accounts';
import { Validators } from '../../validators/validators';
import ValidatorGroups from '../../validator-groups/validator-groups';

import PUB from '../../graphql/subscriptions';

const kit = newKit(Meteor.settings.public.fornoAddress);
const { web3 } = kit;

Meteor.methods({
  'accounts.update': async function (address:string) {
    this.unblock();
    // console.log(`Update wallet address: ${address}`);
    const data: { [c: string]: any } = {
    };
    let balance; let
      totalBalance;
    let code: string;
    const lockedGold: { [c: string]: any } = {
    };
    let account: { [k: string]: any };
    let accounts; let lockedGolds; let
      election;

    try {
      balance = parseFloat(await web3.eth.getBalance(address));
    } catch (e) {
      console.log(`Error when getting account balance ${e}`);
    }

    try {
      totalBalance = await kit.getTotalBalance(address);
    } catch (e) {
      console.log(`Error when getting account total balance ${e}`);
    }

    data.gold = totalBalance?.gold ? totalBalance?.gold.toNumber() : 0;
    data.lockedGold = totalBalance?.lockedGold ? totalBalance?.lockedGold.toNumber() : 0;
    data.usd = totalBalance?.usd ? totalBalance?.usd.toNumber() : 0;
    data.total = totalBalance?.total ? totalBalance?.total.toNumber() : 0;
    data.pending = totalBalance?.pending ? totalBalance?.pending.toNumber() : 0;

    account = Accounts.findOne({
      address,
    });

    const isValidator = Validators.findOne({
      address,
    });

    const isValidatorGroup = ValidatorGroups.findOne({
      address,
    });

    // Get account code (x0)
    if (account) {
      code = account.code;
    } else {
      account = {
      };
      try {
        code = await web3.eth.getCode(address);
      } catch (e) {
        console.log(`Error when getting Account Code ${e}`);
      }
    }
    account.code = code;

    // Get accounts info
    try {
      accounts = await kit.contracts.getAccounts();
    } catch (e) {
      console.log(`Error when getting Accounts ${e}`);
    }

    try {
      lockedGolds = await kit.contracts.getLockedGold();
    } catch (e) {
      console.log(`Error when getting Locked Gold ${e}`);
    }

    try {
      election = await kit.contracts.getElection();
    } catch (e) {
      console.log(`Error when getting Election ${e}`);
    }

    try {
      lockedGold.total = await lockedGolds.getAccountTotalLockedGold(address);
    } catch (e) {
      console.log(`Error when saving Locked Gold Total ${e}`);
    }

    try {
      lockedGold.nonvoting = await lockedGolds.getAccountNonvotingLockedGold(address);
    } catch (e) {
      console.log(`Error when getting Locked Nonvoting Gold Total ${e}`);
    }
    account.lockedGold = lockedGold;

    if (isValidator || isValidatorGroup) {
      try {
        const accountSummary = await accounts.getAccountSummary(address);
        account.accountSummary = accountSummary;
      } catch (e) {
        console.log(`Error when getting Account Summary ${e} for account ${address}`);
      }
    }

    try {
      account.groupsVotedFor = await election.getGroupsVotedForByAccount(address);
      account.hasActivatablePendingVotes = await election.hasActivatablePendingVotes(address);
    } catch (e) {
      console.log(`Error when getting Groups Voted For By Account ${e}`);
    }

    account.balance = balance;
    account.totalBalance = data;

    if (parseInt(balance) >= 0) {
      // update or insert address if balance larger than 0
      Accounts.upsert(
        {
          address,
        },
        {
          $set: account,
        },
        (error: any, result: any) => {
          PUB.pubsub.publish(PUB.ACCOUNT_ADDED, {
            accountAdded: {
              address, balance, totalBalance: data,
            },
          });
        },
      );
    }
  },

  'accounts.getAccount': async function (address: string) {
    this.unblock();
    if (!address) {
      return 'No address provided. ';
    }

    const account = Accounts.findOne({
      address,
    });

    if (!account) {
      return 'Account not found. ';
    }

    return account;
  },
});
