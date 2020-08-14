import { Meteor } from "meteor/meteor"
import { newKit, ContractKit, CeloContract } from "@celo/contractkit"
import { Proposals } from "../../governance/proposals"

let kit = newKit('https://rc1-forno.celo-testnet.org')
let web3 = kit.web3;

Meteor.methods({
    "proposals.getProposals": async function () {

        const governance = await kit._web3Contracts.getGovernance()
        const events = await governance.getPastEvents('ProposalQueued', { fromBlock: 0 })
        const proposalData = {
            proposal: {},
        }

        events.forEach(function (item, index) {
            proposalData.proposal[index + 1] = item
        })

        Object.keys(proposalData.proposal).forEach(function (item) {
            try {
                Proposals.upsert(
                    { proposalNumber: parseFloat(proposalData.proposal[item].returnValues.proposalId) },
                    {
                        $set: proposalData.proposal[item],
                    }

                );
            } catch (e) {
                console.log(e);
            }
        };

        return proposalData
    },

});
