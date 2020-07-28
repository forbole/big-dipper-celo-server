import { Meteor } from "meteor/meteor";
import { newKit } from "@celo/contractkit";
import { Accounts } from "../../accounts/accounts";
import { Chain } from "../../chain/chain";

import PUB from "../../graphql/subscriptions";

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
  "accounts.update": async function (address) {
    console.log("Update wallet address: " + address);
    let data: { [c: string]: any } = {};

    let balance = await web3.eth.getBalance(address);
    let totalBalance = await kit.getTotalBalance(address)

    data.gold = totalBalance.gold.toNumber();
    data.lockedGold = totalBalance.lockedGold.toNumber();
    data.usd = totalBalance.usd.toNumber();
    data.total = totalBalance.total.toNumber();
    data.pending = totalBalance.pending.toNumber();


    if (parseInt(balance) > 0) {
      // update or insert address if balance larger than 0
      Accounts.upsert(
        { address: address },
        { $set: { address: address, balance: parseInt(balance), totalBalance: data } },
        (error, result) => {
          PUB.pubsub.publish(PUB.ACCOUNT_ADDED, {
            accountAdded: { address: address, balance: balance, totalBalance: data },
          });
        }
      );
    }
  },

  "accounts.getLockedGold": async function (address: string) {
      let lockedG: { [c: string]: any } = {};
      let lockedGolds = await kit.contracts.getLockedGold();

      let summary  = (await lockedGolds.getAccountSummary(address));

      if (summary){
        let pendingWithdrawalsTotals = (await lockedGolds.getPendingWithdrawalsTotalValue(address))

        lockedG.total = summary.lockedGold.total
        lockedG.nonvoting = summary.lockedGold.nonvoting
        lockedG.requirement = summary.lockedGold.requirement
        lockedG.pendingWithdrawals = summary.pendingWithdrawals
        lockedG.pendingWithdrawalsTotal = pendingWithdrawalsTotals
  
        return lockedG;
      }

      else{
        return "Address not found."
      }
  },
});
