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
    let balance = await web3.eth.getBalance(address);

    if (parseInt(balance) > 0) {
      // update or insert address if balance larger than 0
      Accounts.upsert(
        { address: address },
        { $set: { address: address, balance: parseInt(balance) } },
        (error, result) => {
          PUB.pubsub.publish(PUB.ACCOUNT_ADDED, {
            accountAdded: { address: address, balance: balance },
          });
        }
      );
    }
  },

  "accounts.getTotalBalance": async function () {
    let accountList = Accounts.find().fetch();

    accountList.forEach(async (listItem) => {
      try {
        let totalBalance = await kit.getTotalBalance(listItem.address)
        let data: { [c: string]: any } = {};
        for (let i in totalBalance) {

          data.gold = totalBalance.gold.toNumber();
          data.lockedGold = totalBalance.lockedGold.toNumber();
          data.usd = totalBalance.usd.toNumber();
          data.total = totalBalance.total.toNumber();
          data.pending = totalBalance.pending.toNumber();

        }
        Accounts.upsert(
          { address: listItem.address },
          {
            $set: { totalBalance: data }
          })

      }
      catch (e) {
        console.log(e)
      }
    }
    )
  },



  // let acc = "0x4caEEFF39cd3b889462b995bDAf2dF97836f490C";
  // let acc1 = "0x050f34537f5b2a00b9b9c752cb8500a3fce3da7d"

  // const accounts = await web3.eth.getAccounts();
  // console.log(accounts)
  // const accountsWrapper = await kit.contracts.getAccounts();

  // console.log(accounts);
  // console.log(accountsWrapper);

  // const account = await kit.contracts.getAccounts();
  // for (let c in accountList){
  //   if(account)
  // }
  // account.getAccountSummary(acc).then((accountSummary) => {
  //   console.log("!!!!account summary");
  //   console.log(accountSummary);
  // });

  // const accounts2 = await web3.eth.getAccounts();
  // let account = accounts2[0];

  // }
// },
});
