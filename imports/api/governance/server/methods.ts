import { Meteor } from "meteor/meteor"
import { newKit, ContractKit, CeloContract } from "@celo/contractkit"
import { Proposals } from "../../governance/proposals"
import BigNumber from 'bignumber.js'
import { ProposalStage } from '@celo/contractkit/lib/wrappers/Governance';
import fetch from 'cross-fetch';
import { Election } from "../../governance/election";

let kit = newKit(Meteor.settings.public.fornoAddress)
let web3 = kit.web3;


function mergeObjects(object1, object2, object3) {

    let mergedObject = {}
    let counter = 0;
    for (let c in object1) {
        mergedObject[counter] = object1[c],
            counter++
    }
    for (let d in object2) {
        mergedObject[counter] = object2[d],
            counter++
    }

    for (let e in object3) {
        mergedObject[counter] = object3[e],
            counter++
    }
    return mergedObject;
}

Meteor.methods({
    "proposals.getProposals": async function () {
        const governance = await kit._web3Contracts.getGovernance()
        const events = await governance.getPastEvents('ProposalQueued', { fromBlock: 0 })
        const proposalData = {
            proposal: {
            }
        }
        const proposalRecord = {};
        let votedAbstain = 0
        let votedNo = 0
        let votedYes = 0
        let votedAbstainList = {}
        let votedNoList = {}
        let votedYesList = {}
        let counterAbstain = 0
        let counterNo = 0
        let counterYes = 0;

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

                // Abstain -> value == 1 
                // No -> value == 2
                // Yes ->  value == 3
                for (let s = 0; s < getTotalVotes.length; s++) {
                    if (getTotalVotes[s].returnValues.proposalId == item && getTotalVotes[s].returnValues.value == 1) {
                        votedAbstain += parseFloat(getTotalVotes[s].returnValues.weight),
                            votedAbstainList[counterAbstain] = getTotalVotes[s],
                            votedAbstainList[counterAbstain]["voteType"] = "Abstain",
                            counterAbstain++
                    }
                    else if (getTotalVotes[s].returnValues.proposalId == item && getTotalVotes[s].returnValues.value == 2) {
                        votedNo += parseFloat(getTotalVotes[s].returnValues.weight),
                            votedNoList[counterNo] = getTotalVotes[s],
                            votedNoList[counterNo]["voteType"] = "No",
                            counterNo++
                    }
                    else if (getTotalVotes[s].returnValues.proposalId == item && getTotalVotes[s].returnValues.value == 3) {
                        votedYes += parseFloat(getTotalVotes[s].returnValues.weight),
                            votedYesList[counterYes] = getTotalVotes[s],
                            votedYesList[counterYes]["voteType"] = "Yes",
                            counterYes++
                    }
                    let allVotesTotal = mergeObjects(votedNoList, votedYesList, votedAbstainList)
                    let totalVotesList = {
                        Abstain: votedAbstainList,
                        No: votedNoList,
                        Yes: votedYesList,
                        All: allVotesTotal
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
    },


    'election.update': async function (latestHeight: number) {

        let validatorsData = await kit.contracts.getValidators()
        let registeredValidatorGroups = await validatorsData.getRegisteredValidatorGroups()
        let registeredValidators = await validatorsData.getRegisteredValidators()

        let epochNumber = await kit.getEpochNumberOfBlock(latestHeight)
        let lastEpochNumber = epochNumber - 1

        let election = await kit.contracts.getElection()

        let electedValidatorSet = await election.getElectedValidators(lastEpochNumber)

        let electedGroup = [];

        for (let c = 0; c < electedValidatorSet.length; c++) {
            electedGroup[c] = electedValidatorSet[c].affiliation
        }

        let electedGroupSet;
        for (let c = 0; c < electedValidatorSet.length; c++) {
            electedGroupSet = Array.from(new Set(electedGroup))
        }

        try {
            Election.upsert({}, { $set: { registeredValidators: registeredValidators.length, electedValidators: electedValidatorSet.length, registeredValidatorGroups: registeredValidatorGroups.length, electedValidatorGroups: electedGroupSet.length } })
        }
        catch (e) {
            console.log("=== Error when upserting election ===")
            console.log(e)
        }

    }
});

