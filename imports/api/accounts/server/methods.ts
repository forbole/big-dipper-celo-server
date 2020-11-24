import { Meteor } from "meteor/meteor"
import { newKit } from "@celo/contractkit"
import { Accounts } from "../../accounts/accounts"

import PUB from "../../graphql/subscriptions"
import BigNumber from 'bignumber.js';

// import AccountBalance  from '@celo/contractkit/lib/wrappers/Accounts'

let kit = newKit(Meteor.settings.public.fornoAddress)
let web3 = kit.web3

Meteor.methods({
  "accounts.update": async function (address) {
    console.log("Update wallet address: " + address)
    let data: { [c: string]: any } = {}
    let balance, totalBalance;
    try {
      balance = parseFloat(await web3.eth.getBalance(address))
      totalBalance = await kit.getTotalBalance(address)
      data.gold = totalBalance && totalBalance.gold ? totalBalance.gold.toNumber() : 0;
      data.lockedGold = totalBalance && totalBalance.lockedGold ? totalBalance.lockedGold.toNumber() : 0
      data.usd = totalBalance && totalBalance.usd ? totalBalance.usd.toNumber() : 0;
      data.total = totalBalance && totalBalance.total ? totalBalance.total.toNumber() : 0
      data.pending = totalBalance && totalBalance.pending ? totalBalance.pending.toNumber() : 0;
    }
    catch (e) {
      console.log("Error when getting account balance " + e)
    }



    let account: { [k: string]: any }
    account = Accounts.findOne({ address: address })
    let code: string;
    let lockedGold: { [c: string]: any } = {}
    let accounts, lockedGolds;

    if (account) {
      code = account.code
    }
    else {
      account = {}
      try {
        code = await web3.eth.getCode(address)
      }
      catch (e) {
        console.log("Error when getting Account Code " + e)
      }
    }

    account.code = code


    try {
      accounts = await kit.contracts.getAccounts()
      lockedGolds = await kit.contracts.getLockedGold()
    }
    catch (error) {
      console.log("Error when getting Locked Gold " + error)
    }

    try {
      let lockedGoldSummary = await lockedGolds.getAccountSummary(address)

      if (lockedGoldSummary) {
        let pendingWithdrawalsTotals = (await lockedGolds.getPendingWithdrawalsTotalValue(address))

        lockedGold.total = lockedGoldSummary && lockedGoldSummary.lockedGold && lockedGoldSummary.lockedGold.total ? lockedGoldSummary.lockedGold.total : 0;
        lockedGold.nonvoting = lockedGoldSummary && lockedGoldSummary.lockedGold && lockedGoldSummary.lockedGold.nonvoting ? lockedGoldSummary.lockedGold.nonvoting : 0;
        lockedGold.requirement = lockedGoldSummary && lockedGoldSummary.lockedGold && lockedGoldSummary.lockedGold.requirement ? lockedGoldSummary.lockedGold.requirement : 0;
        lockedGold.pendingWithdrawals = lockedGoldSummary && lockedGoldSummary.pendingWithdrawals ? lockedGoldSummary.pendingWithdrawals : 0;
        lockedGold.pendingWithdrawalsTotal = pendingWithdrawalsTotals ? pendingWithdrawalsTotals : 0;
      }
    }
    catch (e) {
      console.log("Error when getting Locked Gold Account Summary " + e)
    }

    try {
      let accountSummary = await accounts.getAccountSummary(address)

      account.lockedGold = lockedGold
      account.accountSummary = accountSummary
    }
    catch (e) {
      console.log("Error when getting Account Summary " + e)
    }

    account.balance = balance
    account.totalBalance = data

    if (parseInt(balance) > 0) {
      // update or insert address if balance larger than 0
      Accounts.upsert(
        { address: address },
        { $set: account },
        (error: any, result: any) => {
          PUB.pubsub.publish(PUB.ACCOUNT_ADDED, {
            accountAdded: { address: address, balance: balance, totalBalance: data },
          })
        }
      );
    }
  },

  "accounts.getAccount": async function (address: string) {
    if (!address) {
      return "No address provided."
    }

    let account = Accounts.findOne({ address: address })

    if (!account) {
      return "Account not found.";
    }

    return account
  },
});
