import { Meteor } from "meteor/meteor"
import { newKit, ContractKit, CeloContract } from "@celo/contractkit"
import { Proposals } from "../../governance/proposals"
import BigNumber from 'bignumber.js'
import { ProposalStage } from '@celo/contractkit/lib/wrappers/Governance';
import fetch from 'cross-fetch'

let kit = newKit('https://rc1-forno.celo-testnet.org')
let web3 = kit.web3;


Meteor.methods({
    "proposals.getProposals": async function () {
        const governance = await kit._web3Contracts.getGovernance()
        const events = await governance.getPastEvents('ProposalQueued', { fromBlock: 0 })
        const proposalData = {
            proposal: {},
        }
        const proposalRecord = {};

        events.forEach(function (item, index) {
            proposalData.proposal[index + 1] = item
        })

        const getGovernance = await kit.contracts.getGovernance()

        for (let c in proposalData.proposal) {
            proposalRecord[c] = await getGovernance.getProposalRecord(c)
            if (proposalRecord[c].stage === ProposalStage.Expiration) {
                proposalData.proposal[c].minDeposit = (await getGovernance.minDeposit()).toNumber()

                const executedProposals = await governance.getPastEvents('ProposalExecuted', { fromBlock: 0 })

                if (executedProposals.find((e) => new BigNumber(e.returnValues.proposalId).eq(c))) {
                    proposalData.proposal[c].status = "Approved"
                }
                else {
                    proposalData.proposal[c].status = "Rejected"
                }
                const duration = await getGovernance.stageDurations()
                let proposalEpoch = new BigNumber(proposalData.proposal[c].returnValues.timestamp)
                let referrendumEpoch = proposalEpoch.plus(duration.Approval)
                let executionEpoch = referrendumEpoch.plus(duration.Referendum)
                let expirationEpoch = executionEpoch.plus(duration.Execution)

                proposalData.proposal[c].proposalEpoch = proposalEpoch.toNumber()
                proposalData.proposal[c].referrendumEpoch = referrendumEpoch.toNumber()
                proposalData.proposal[c].executionEpoch = executionEpoch.toNumber()
                proposalData.proposal[c].expirationEpoch = expirationEpoch.toNumber()

                proposalData.proposal[c].upvotes = (await getGovernance.getUpvotes(c)).toNumber()
                proposalData.proposal[c].votes = (await getGovernance.getVotes(c))

            }

            await fetch(`https://raw.githubusercontent.com/celo-org/celo-proposals/master/CGPs/000${c}.md`)
                .then((response) => response.text())
                .then((text) => {
                    const [title, executed, proposalOverview] = text.split("#").filter(function (el) { return el.length != 0 })
                    const [proposalTitle, proposalDateYear, proposalDateMonth, proposalDateDay, proposalAuthor, proposalStatus] = title.split("-").filter(function (el) { return el.length != 0 })
                    proposalData.proposal[c].proposalTitle = proposalTitle
                    proposalData.proposal[c].proposalAuthor = proposalAuthor
                    proposalData.proposal[c].proposalStatus = proposalStatus
                    proposalData.proposal[c].proposalOverview = proposalOverview
                })
        }


        Object.keys(proposalData.proposal).forEach(function (item) {
            try {
                Proposals.upsert(
                    { proposalNumber: parseFloat(proposalData.proposal[item].returnValues.proposalId) },
                    {
                        $set: proposalData.proposal[item],
                    }

                )
            } catch (e) {
                console.log(e);
            }
        });

        return proposalData
    }
});
