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
        this.unblock()

        console.log("Start proposals.getProposals")
        let governance, events, getGovernance, executedProposals, getUpvoters, getTotalVotes;

        try {
            governance = await kit._web3Contracts.getGovernance()
        }
        catch (error) {
            console.log("Error when getting _web3Contracts Governance Contract " + error)
        }

        try {
            events = await governance.getPastEvents('ProposalQueued', { fromBlock: 0 })
        }
        catch (error) {
            console.log("Error when getting the Governance Past Events " + error)
        }


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

        try {
            getGovernance = await kit.contracts.getGovernance()
        }
        catch (error) {
            console.log("Error when getting Governance Contract " + error)
        }


        Object.keys(proposalData.proposal).forEach(async function (item: any, index: number) {
            try {
                proposalRecord[item] = await getGovernance.getProposalRecord(item)
            }
            catch (error) {
                console.log("Error when getting Governance Proposal Record " + error)
            }

            if (proposalRecord[item].stage === ProposalStage.Expiration) {
                try {
                    proposalData.proposal[item].minDeposit = (await getGovernance.minDeposit()).toNumber()
                }
                catch (error) {
                    console.log("Error when getting Governance Min Deposit " + error)
                }

                try {
                    executedProposals = await governance.getPastEvents('ProposalExecuted', { fromBlock: 0 })
                }
                catch (error) {
                    console.log("Error when getting Governance Executed Proposals " + error)
                }

                try{
                    if (executedProposals.find((e) => new BigNumber(e.returnValues.proposalId).eq(item))) {
                        proposalData.proposal[item].status = "Approved"
                    }
                    else {
                        proposalData.proposal[item].status = "Rejected"
                    }
                }
                catch(e){
                    console.log("Error when getting proposal status")
                }
               


                try {
                    getUpvoters = await governance.getPastEvents('ProposalUpvoted', { fromBlock: 0 })
                }
                catch (error) {
                    console.log("Error when getting Governance Upvoted Proposals " + error)
                }

                try {
                    getTotalVotes = await governance.getPastEvents('ProposalVoted', { fromBlock: 0 })
                }
                catch (error) {
                    console.log("Error when getting Governance Voted Proposals " + error)
                }

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
                let duration;
                try {
                    duration = await getGovernance.stageDurations();

                }
                catch (error) {
                    console.log("Error when getting Governance Durations " + error);
                }

                let proposalEpoch = proposalData && proposalData.proposal[item] && proposalData.proposal[item].returnValues && proposalData.proposal[item].returnValues.timestamp ?
                    new BigNumber(proposalData.proposal[item].returnValues.timestamp) : new BigNumber(0);
                let referrendumEpoch = proposalEpoch && duration && duration.Approval ? proposalEpoch.plus(duration.Approval) : new BigNumber(0);
                let executionEpoch = referrendumEpoch && duration && duration.Referendum ? referrendumEpoch.plus(duration.Referendum) : new BigNumber(0);
                let expirationEpoch = executionEpoch && duration && duration.Execution ? executionEpoch.plus(duration.Execution) : new BigNumber(0);

                proposalData.proposal[item].proposalEpoch = proposalEpoch ? proposalEpoch.toNumber() : 0;
                proposalData.proposal[item].referrendumEpoch = referrendumEpoch ? referrendumEpoch.toNumber() : 0;
                proposalData.proposal[item].executionEpoch = executionEpoch ? executionEpoch.toNumber() : 0;
                proposalData.proposal[item].expirationEpoch = expirationEpoch ? expirationEpoch.toNumber() : 0;

                try {
                    proposalData.proposal[item].upvotes = (await getGovernance.getUpvotes(item)).toNumber()

                }
                catch (error) {
                    console.log("Error when getting Governance Upvotess" + error)
                }


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
        this.unblock()
        let validatorsData, registeredValidatorGroups, registeredValidators, epochNumber, lastEpochNumber, election, electedValidatorSet;

        try {
            validatorsData = await kit.contracts.getValidators()
            registeredValidatorGroups = await validatorsData.getRegisteredValidatorGroups()
            registeredValidators = await validatorsData.getRegisteredValidators()

            epochNumber = await kit.getEpochNumberOfBlock(latestHeight)
            lastEpochNumber = epochNumber - 1

            election = await kit.contracts.getElection()

            electedValidatorSet = await election.getElectedValidators(lastEpochNumber)

        }
        catch (error) {
            console.log("Error while getting Validators Contract " + error)
        }


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


