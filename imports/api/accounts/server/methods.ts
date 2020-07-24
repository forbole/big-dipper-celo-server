import { Meteor } from "meteor/meteor";
import { newKit } from "@celo/contractkit";
import { Accounts } from "../../accounts/accounts";
import { Chain } from "../../chain/chain";

import PUB from "../../graphql/subscriptions";
import { BigNumber } from 'bignumber.js'
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


  "accounts.getAccountSummary": async function () {
    let accountList = Accounts.find().fetch();

    accountList.forEach(async (item) => {
      try {
        let accounts = await kit.contracts.getAccounts()
        let accountSummary: { [c: string]: any } = {};
        try {
          accountSummary.summary = await accounts.getAccountSummary(item.address)
          accountSummary.isAccount = await accounts.isAccount(item.address)
          accountSummary.isSigner = await accounts.isSigner(item.address)

          Accounts.upsert(
            { address: item.address },
            {
              $set: { accountSummary: accountSummary.summary, isAccount: accountSummary.isAccount, isSigner: accountSummary.isSigner }
            })
        }

        catch (e) {
          console.log(e)
        }
      }

      catch (e) {
        console.log(e)
      }
    }
    )

  },


  "accounts.getAttestations": async function () {
    let accountList = Accounts.find().fetch();

    accountList.forEach(async (item) => {
      try {
        let attestations = await kit.contracts.getAttestations();
        let attestationList: { [c: string]: any } = {};
        try {
          attestationList.requestFees = (await attestations.attestationRequestFees(item.address)).toNumber()
          attestationList.expiryBlocks = await attestations.attestationExpiryBlocks()
          // attestation.feeRequired = await (await attestations.attestationFeeRequired(attestation.requestFees)).toNumber()

          try {
            Accounts.upsert(
              { address: item.address },
              {
                $set: { attestation: attestationList }
              })
          }

          catch (e) {
            console.log(e)
          }

        }
        catch (e) {
          console.log(e)
        }
      }

      catch (e) {
        console.log(e)
      }
    }
    )

  },

  "accounts.getLockedGold": async function () {
    let accountList = Accounts.find().fetch();

    accountList.forEach(async (item) => {
      try {
        let lockedG: { [c: string]: any } = {};
        let lockedGolds = await kit.contracts.getLockedGold();

        try {
          let summary  = (await lockedGolds.getAccountSummary(item.address))
          let pendingWithdrawalsTotals = (await lockedGolds.getPendingWithdrawalsTotalValue(item.address))
          try {
            lockedG.total = summary.lockedGold.total.toNumber()
            lockedG.nonvoting = summary.lockedGold.nonvoting.toNumber()
            lockedG.requirement = summary.lockedGold.requirement.toNumber()
            lockedG.pendingWithdrawals = summary.pendingWithdrawals
            lockedG.pendingWithdrawalsTotal = pendingWithdrawalsTotals.toNumber()
            try {
              Accounts.upsert(
                { address: item.address },
                {
                  $set: { lockedGold: lockedG }
                })
            }
            catch (e) {
              console.log(e)
            }
          }
          catch (e) {

          }

        }
        catch (e) {
          console.log(e)
        }
      }
      catch (e) {
        console.log(e)
      }
    })
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
