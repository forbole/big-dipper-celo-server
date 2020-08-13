import { Meteor } from "meteor/meteor"
import { newKit, ContractKit, CeloContract } from "@celo/contractkit"
import { Proposals } from "../../governance/proposals"

let kit = newKit(Meteor.settings.public.fornoAddress)
let web3 = kit.web3;

Meteor.methods({
    "proposals.getProposals": async function () {

        const governance = await kit._web3Contracts.getGovernance()
        const events = await governance.getPastEvents('ProposalQueued', { fromBlock: 0 })
        let proposalData: { [proposal: string]: any } = {}

        events.forEach(function (item, index) {
            proposalData[index + 1] = item
        })

        // console.log("~~~~~~~~~~~~")
        // console.log(proposalData)
        // console.log("~~~~~~~~~~~~")

        // Object.keys(proposalData).forEach(function (item) {
        //     try {
        //         Proposals.upsert(
        //             {},
        //             {
        //                 $set: {
        //                     proposal: proposalData[item],
        //                 },
        //             },

        //         );
        //     } catch (e) {
        //         console.log(e);
        //     }
        // });

        console.log("~~~~~~~~~~~~~")
        console.log(proposalData);

        return proposalData;
    },


});
