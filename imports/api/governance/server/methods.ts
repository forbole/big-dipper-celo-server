import { Meteor } from "meteor/meteor"
import { newKit, ContractKit, CeloContract } from "@celo/contractkit"
import { Proposals } from "../../governance/proposals"
import BigNumber from 'bignumber.js'
import { ProposalStage } from '@celo/contractkit/lib/wrappers/Governance';
import fetch from 'cross-fetch'

let kit = newKit(Meteor.settings.public.fornoAddress)
let web3 = kit.web3;


Meteor.methods({
    "proposals.getProposals": async function () {
        const governance = await kit._web3Contracts.getGovernance()
        const events = await governance.getPastEvents('ProposalQueued', { fromBlock: 0 })
        const proposalData = {
            proposal: {
            }
        }
        const proposalRecord = {};

        events.forEach(function (item, index) {
            proposalData.proposal[index + 1] = item,
                proposalData.proposal[index + 1].upvoteList = []
        })

        const getGovernance = await kit.contracts.getGovernance()

        Object.keys(proposalData.proposal).forEach(async function (item: any, index: number) {
            proposalRecord[item] = await getGovernance.getProposalRecord(item)

            if (proposalRecord[item].stage === ProposalStage.Expiration) {
                proposalData.proposal[item].minDeposit = (await getGovernance.minDeposit()).toNumber()

                const executedProposals = await governance.getPastEvents('ProposalExecuted', { fromBlock: 0 })

                if (executedProposals.find((e) => new BigNumber(e.returnValues.proposalId).eq(item))) {
                    proposalData.proposal[item].status = "Approved"
                }
                else {
                    proposalData.proposal[item].status = "Rejected"
                }

                const getUpvoters: any[] = await governance.getPastEvents('ProposalUpvoted', { fromBlock: 0 })

                const getTotalVotes: any[] = await governance.getPastEvents('ProposalVoted', { fromBlock: 0 })

                let votedAbstain = 0
                let votedNo = 0
                let votedYes = 0
                let votedAbstainList = {}
                let votedNoList = {}
                let votedYesList = {}
                let counterAbstain = 0
                let counterNo = 0
                let counterYes = 0;

                // Abstain -> value == 1 
                // No -> value == 2
                // Yes ->  value == 3
                for (let s = 0; s < getTotalVotes.length; s++) {
                    if (getTotalVotes[s].returnValues.proposalId == item && getTotalVotes[s].returnValues.value == 1) {
                        votedAbstain += parseFloat(getTotalVotes[s].returnValues.weight),
                            votedAbstainList[counterAbstain] = getTotalVotes[s],
                            counterAbstain++
                    }
                    else if (getTotalVotes[s].returnValues.proposalId == item && getTotalVotes[s].returnValues.value == 2) {
                        votedNo += parseFloat(getTotalVotes[s].returnValues.weight),
                            votedNoList[counterNo] = getTotalVotes[s],
                            counterNo++
                    }
                    else if (getTotalVotes[s].returnValues.proposalId == item && getTotalVotes[s].returnValues.value == 3) {
                        votedYes += parseFloat(getTotalVotes[s].returnValues.weight),
                            votedYesList[counterYes] = getTotalVotes[s],
                            counterYes++
                    }
                    let totalVotesList = {
                        Abstain: votedAbstainList,
                        No: votedNoList,
                        Yes: votedYesList
                    }
                    let totalVotesValue = votedAbstain + votedNo + votedYes
                    let totalVotes = {
                        Abstain: votedAbstain,
                        No: votedNo,
                        Yes: votedYes,
                        Total: totalVotesValue
                    }
                    proposalData.proposal[item].votes = totalVotes
                    proposalData.proposal[item].totalVotesList = totalVotesList
                }

                let upvotersList = {};
                let counter = 0;
                for (let s = 0; s < getUpvoters.length; s++) {
                    if (getUpvoters[s].returnValues.proposalId === item) {
                        upvotersList[counter] = getUpvoters[s],
                            counter++
                    }
                    proposalData.proposal[item].upvoteList = upvotersList

                }

                const duration = await getGovernance.stageDurations()
                let proposalEpoch = new BigNumber(proposalData.proposal[item].returnValues.timestamp)
                let referrendumEpoch = proposalEpoch.plus(duration.Approval)
                let executionEpoch = referrendumEpoch.plus(duration.Referendum)
                let expirationEpoch = executionEpoch.plus(duration.Execution)

                proposalData.proposal[item].proposalEpoch = proposalEpoch.toNumber()
                proposalData.proposal[item].referrendumEpoch = referrendumEpoch.toNumber()
                proposalData.proposal[item].executionEpoch = executionEpoch.toNumber()
                proposalData.proposal[item].expirationEpoch = expirationEpoch.toNumber()

                proposalData.proposal[item].upvotes = (await getGovernance.getUpvotes(item)).toNumber()
                // proposalData.proposal[item].votes = (await getGovernance.getVotes(item))

                await fetch(`https://raw.githubusercontent.com/celo-org/celo-proposals/master/CGPs/000${item}.md`)
                    .then((response) => response.text())
                    .then((text) => {
                        const [title, executed, proposalOverview] = text.split("#").filter(function (el) { return el.length != 0 })
                        const [proposalTitle, proposalDateYear, proposalDateMonth, proposalDateDay, proposalAuthor, proposalStatus] = title.split("-").filter(function (el) { return el.length != 0 })
                        proposalData.proposal[item].proposalTitle = proposalTitle
                        proposalData.proposal[item].proposalAuthor = proposalAuthor
                        proposalData.proposal[item].proposalStatus = proposalStatus
                        proposalData.proposal[item].proposalOverview = proposalOverview
                    })

                Object.keys(proposalData.proposal).forEach(function (element) {
                    try {
                        Proposals.upsert(
                            { proposalNumber: parseFloat(proposalData.proposal[element].returnValues.proposalId) },
                            {
                                $set: proposalData.proposal[element],
                            }

                        )
                    } catch (e) {
                        console.log(e);
                    }
                });
            }
        })

        return proposalData
    }
});
