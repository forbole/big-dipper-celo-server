import { Meteor } from "meteor/meteor"
import { newKit } from "@celo/contractkit"
import { Accounts } from "../../accounts/accounts"

import PUB from "../../graphql/subscriptions"


let kit = newKit(Meteor.settings.public.fornoAddress)
let web3 = kit.web3

Meteor.methods({
  "accounts.update": async function (address) {
    this.unblock()
    console.log("Update wallet address: " + address)
    let data: { [c: string]: any } = {}
    let balance, totalBalance;
    let code: string;
    let lockedGold: { [c: string]: any } = {};
    let account: { [k: string]: any };
    let accounts, lockedGolds, election;

    try {
      balance = parseFloat(await web3.eth.getBalance(address))
      totalBalance = await kit.getTotalBalance(address)
    }
    catch (e) {
      console.log("Error when getting account balance " + e)
    }

      data.gold = totalBalance && totalBalance.gold ? totalBalance.gold.toNumber() : 0;
      data.lockedGold = totalBalance && totalBalance.lockedGold ? totalBalance.lockedGold.toNumber() : 0
      data.usd = totalBalance && totalBalance.usd ? totalBalance.usd.toNumber() : 0;
      data.total = totalBalance && totalBalance.total ? totalBalance.total.toNumber() : 0
      data.pending = totalBalance && totalBalance.pending ? totalBalance.pending.toNumber() : 0;


    account = Accounts.findOne({ address: address })

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
    }
    catch (error) {
      console.log("Error when getting Accounts " + error)
    }

    try {
      lockedGolds = await kit.contracts.getLockedGold()
    }
    catch (error) {
      console.log("Error when getting Locked Gold " + error)
    }

    try {
      election = await kit.contracts.getElection()
    }
    catch (error) {
      console.log("Error when getting Election " + error)
    }

    try{
     lockedGold.total = await lockedGolds.getAccountTotalLockedGold(address) 
    }
    catch (error){
      console.log("Error when saving Locked Gold Total " + error)
    }

    try{
       lockedGold.nonvoting = await lockedGolds.getAccountNonvotingLockedGold(address) 
    }
    catch (error){
        console.log("Error when getting Locked Nonvoting Gold Total " + error)
    }

    try {
      let accountSummary = await accounts.getAccountSummary(address)
      account.lockedGold = lockedGold
      account.accountSummary = accountSummary
    }
    catch (e) {
      console.log("Error when getting Account Summary " + e)
    }

    try{
      account.groupsVotedFor = await election.getGroupsVotedForByAccount(address)

    }
    catch (e) {
      console.log("Error when getting Groups Voted For By Account " + e)
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
    this.unblock()
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
