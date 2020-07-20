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
    // let totalBalance = kit.getTotalBalance(address);
    // console.log("TOTAL BALANCE");
    // console.log(totalBalance);

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

  // "accounts.getAccountSummary": async function (address) {
  //   let accountList = Accounts.find().fetch();
  //   console.log(accountList);
  //   let acc = "0x4caEEFF39cd3b889462b995bDAf2dF97836f490C";

  //   const accounts = await web3.eth.getAccounts();
  //   const accountsWrapper = await kit.contracts.getAccounts();

  //   // console.log(accounts);
  //   // console.log(accountsWrapper);

  //   let totalBalance = await kit.getTotalBalance(acc);
  //   console.log(totalBalance);


  //   // const account = await kit.contracts.getAccounts();
  //   // for (let c in accountList){
  //   //   if(account)
  //   // }
  //   // account.getAccountSummary(acc).then((accountSummary) => {
  //   //   console.log("!!!!account summary");
  //   //   console.log(accountSummary);
  //   // });

  //   const accounts2 = await web3.eth.getAccounts();
  //   let account = accounts2[0];

  //   console.log(account);
  //   // if (parseInt(balance) > 0) { 
  //   //   // update or insert address if balance larger than 0
  //   //   Accounts.upsert(
  //   //     { address: address },
  //   //     { $set: { address: address, balance: parseInt(balance) } },
  //   //     (error, result) => {
  //   //       PUB.pubsub.publish(PUB.ACCOUNT_ADDED, {
  //   //         accountAdded: { address: address, balance: balance },
  //   //       });
  //   //     }
  //   //   );
  //   // }
  // },
});
