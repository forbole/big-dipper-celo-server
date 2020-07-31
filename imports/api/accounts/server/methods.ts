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

  "accounts.getAccount": async function (address: string) {
      if (!address){
        return "No address provided."
      }

      let account = Accounts.findOne({address:address});

      if (!account){
        return "Account not found.";
      }

      let lockedGold: { [c: string]: any } = {};
      let accounts = await kit.contracts.getAccounts();
      let lockedGolds = await kit.contracts.getLockedGold();

      try{
        let lockedGoldSummary  = await lockedGolds.getAccountSummary(address);

        if (lockedGoldSummary){
          let pendingWithdrawalsTotals = (await lockedGolds.getPendingWithdrawalsTotalValue(address))
  
          lockedGold.total = lockedGoldSummary.lockedGold.total
          lockedGold.nonvoting = lockedGoldSummary.lockedGold.nonvoting
          lockedGold.requirement = lockedGoldSummary.lockedGold.requirement
          lockedGold.pendingWithdrawals = lockedGoldSummary.pendingWithdrawals
          lockedGold.pendingWithdrawalsTotal = pendingWithdrawalsTotals
    
          // return lockedG;
        }
      }
      catch(e){
        console.log(e);
      }

      try{
        let accountSummary = await accounts.getAccountSummary(address);

        account.lockedGold = lockedGold;
        account.accountSummary = accountSummary;
      }
      catch(e){
        console.log(e);
      }
      // console.log(account);
      return account;
  },
});
