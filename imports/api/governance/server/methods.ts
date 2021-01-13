import { Meteor } from "meteor/meteor"
import { newKit, ContractKit, CeloContract } from "@celo/contractkit"
import { Proposals } from "../../governance/proposals"
import BigNumber from 'bignumber.js'
import { ProposalStage } from '@celo/contractkit/lib/wrappers/Governance';
import fetch from 'cross-fetch';
import { Election } from "../../governance/election";
import * as abiDecoder from 'abi-decoder';
import { Contracts } from '../../contracts/contracts';

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
        let proposalQueuedEvent = {};
        // let saveTxDetails = [];
        let proposalRec = [];
        let proposalData = [];

        try {
            governance = await kit._web3Contracts.getGovernance()
        }
        catch (error) {
            console.log("Error when getting _web3Contracts Governance Contract " + error)
        }
        try {
            proposalQueuedEvent = await governance.getPastEvents('ProposalQueued', { fromBlock: 0 })

            for(let c in proposalQueuedEvent){
                let getTransaction =  await web3.eth.getTransaction(proposalQueuedEvent[c].transactionHash);
                let contract = Contracts.findOne({ address: proposalQueuedEvent[c].address });
                abiDecoder.addABI(contract.ABI);
                     
                let decodedInput = abiDecoder.decodeMethod(getTransaction.input);
                proposalData[c] = proposalQueuedEvent[c];
                proposalData[c].proposalId = parseInt(proposalQueuedEvent[c]?.returnValues?.proposalId);

                proposalData[c].input = decodedInput;
            }
        }
        catch (error) {
            console.log("Error when getting the Governance Past Events " + error)
        }


        try {
            getGovernance = await kit.contracts.getGovernance()
             
            for(let d = 0; d < proposalData.length; d++){
                if(d+1 == proposalData[d].returnValues.proposalId){
                    proposalRec[d] = await getGovernance.getProposalRecord(d+1)
                    proposalData[d].stage = proposalRec[d].stage;
                }
            }
        }
        catch (error) {
            console.log("Error when getting Governance Contract " + error)
        }

       try {
            executedProposals = await governance.getPastEvents('ProposalExecuted', { fromBlock: 0 })
            }
        catch (error) {
            console.log("Error when getting Governance Executed Proposals " + error)
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



        for(let a = 0; a < proposalData.length; a++){
        if(proposalData[a].stage === ProposalStage.Expiration){
            if (executedProposals.find((e) => new BigNumber(e.returnValues.proposalId).eq(a+1))) {
                proposalData[a].status = "Approved"
            }
            else {
                proposalData[a].status = "Rejected"
            }  
        }
    }

    for(let item = 0; item < proposalData.length; item++){
             let votedAbstain = 0
        let votedNo = 0
        let votedYes = 0
        let votedAbstainList = {}
        let votedNoList = {}
        let votedYesList = {}
        let counterAbstain = 0
        let counterNo = 0
        let counterYes = 0;
        let duration;
        let upvotersList = {};
        let counter = 0;

        // Abstain -> value == 1 
        // No -> value == 2
        // Yes ->  value == 3
        for (let s = 0; s < getTotalVotes.length; s++) {
        
            if (getTotalVotes[s].returnValues.proposalId == item+1 && getTotalVotes[s].returnValues.value == 1) {
                votedAbstain += parseFloat(getTotalVotes[s].returnValues.weight),
                    votedAbstainList[counterAbstain] = getTotalVotes[s],
                    votedAbstainList[counterAbstain]["voteType"] = "Abstain",
                    counterAbstain++
            }
        else if (getTotalVotes[s].returnValues.proposalId == item+1 && getTotalVotes[s].returnValues.value == 2) {
                votedNo += parseFloat(getTotalVotes[s].returnValues.weight),
                    votedNoList[counterNo] = getTotalVotes[s],
                    votedNoList[counterNo]["voteType"] = "No",
                    counterNo++
            }
        else if (getTotalVotes[s].returnValues.proposalId == item+1 && getTotalVotes[s].returnValues.value == 3) {
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
            proposalData[item].votes = totalVotes
            proposalData[item].totalVotesList = totalVotesList
        }

   
        for (let s = 0; s < getUpvoters.length; s++) {
            if (getUpvoters[s].returnValues.proposalId === item) {
                upvotersList[counter] = getUpvoters[s],
                    counter++
            }
            proposalData[item].upvoteList = upvotersList

        }


        try {
            duration = await getGovernance.stageDurations();

        }
        catch (error) {
            console.log("Error when getting Governance Durations " + error);
        }

        let proposalEpoch = proposalData[item]?.returnValues?.timestamp ?
            new BigNumber(proposalData[item]?.returnValues?.timestamp) : new BigNumber(0);
        let referrendumEpoch = proposalEpoch && duration && duration.Approval ? proposalEpoch.plus(duration.Approval) : new BigNumber(0);
        let executionEpoch = referrendumEpoch && duration && duration.Referendum ? referrendumEpoch.plus(duration.Referendum) : new BigNumber(0);
        let expirationEpoch = executionEpoch && duration && duration.Execution ? executionEpoch.plus(duration.Execution) : new BigNumber(0);

        proposalData[item].proposalEpoch = proposalEpoch ? proposalEpoch.toNumber() : 0;
        proposalData[item].referrendumEpoch = referrendumEpoch ? referrendumEpoch.toNumber() : 0;
        proposalData[item].executionEpoch = executionEpoch ? executionEpoch.toNumber() : 0;
        proposalData[item].expirationEpoch = expirationEpoch ? expirationEpoch.toNumber() : 0;

        try {
            proposalData[item].upvotes = (await getGovernance.getUpvotes(item)).toNumber()

        }
        catch (error) {
            console.log("Error when getting Governance Upvotess" + error)
        }

    }

        Object.keys(proposalData).forEach(function (element) {
            try {
                Proposals.upsert(
                    { proposalId: parseInt(proposalData[element].returnValues.proposalId) },
                    {
                        $set: proposalData[element],
                    }

                )
            } catch (e) {
                console.log(e);
            }
        });

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


