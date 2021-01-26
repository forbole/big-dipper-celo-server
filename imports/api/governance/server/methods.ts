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

const decodeInput = async (proposalData, proposalQueuedEvent) => {
        for(let c = 1; c <= Object.keys(proposalQueuedEvent).length; c++){
            try{
                let getTransaction =  await web3.eth.getTransaction((proposalQueuedEvent[c]?.transactionHash));
                let contract = Contracts.findOne({ address: proposalQueuedEvent[c].address });
                abiDecoder.addABI(contract?.ABI);
                        
                let decodedInput = abiDecoder.decodeMethod(getTransaction.input);
                proposalData[c-1] = proposalQueuedEvent[c];
                proposalData[c-1].proposalId = parseInt(proposalQueuedEvent[c]?.returnValues?.proposalId) < 7 ? parseInt(proposalQueuedEvent[c]?.returnValues?.proposalId) - 1 : parseInt(proposalQueuedEvent[c]?.returnValues?.proposalId);

                proposalData[c-1].input = decodedInput;
            }
            catch(e){
                console.log(`Error when decoding input for proposal ${c} ` + e)
            }
        
}}



const saveProposalVotes = (proposalData, getTotalVotes) => {
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

        // Abstain -> value == 1 
        // No -> value == 2
        // Yes ->  value == 3
        for (let s = 0; s < getTotalVotes.length; s++) {
        
            if (getTotalVotes[s].returnValues.proposalId == item+2 && getTotalVotes[s].returnValues.value == 1) {
                votedAbstain += parseFloat(getTotalVotes[s].returnValues.weight),
                    votedAbstainList[counterAbstain] = getTotalVotes[s],
                    votedAbstainList[counterAbstain]["voteType"] = "Abstain",
                    counterAbstain++
            }
        else if (getTotalVotes[s].returnValues.proposalId == item+2 && getTotalVotes[s].returnValues.value == 2) {
                votedNo += parseFloat(getTotalVotes[s].returnValues.weight),
                    votedNoList[counterNo] = getTotalVotes[s],
                    votedNoList[counterNo]["voteType"] = "No",
                    counterNo++
            }
        else if (getTotalVotes[s].returnValues.proposalId == item+2 && getTotalVotes[s].returnValues.value == 3) {
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
    }
};

const saveUpvoteList = (proposalData, getUpvoters) => {
    for(let item = 0; item < proposalData.length; item++){
    let upvotersList = {};
    let counter = 0;
    
    for (let s = 0; s < getUpvoters.length; s++) {
        if (parseInt(getUpvoters[s].returnValues.proposalId) === item+2) {
            upvotersList[counter] = getUpvoters[s],
                counter++
        }
        proposalData[item].upvoteList = upvotersList

    }
  }
};

const saveProposalDurations = (proposalData,duration) => {
        for(let item = 0; item < proposalData.length; item++){
        let submittedTime = new BigNumber(proposalData[item]?.returnValues?.timestamp).toNumber()

        let approvalPhaseTime =  new BigNumber(submittedTime).plus(duration?.Approval).toNumber();

        let votingPhaseEndTime = new BigNumber(approvalPhaseTime).plus(duration.Referendum).toNumber();
        let votingPhaseStartTime = new BigNumber(votingPhaseEndTime).minus(duration?.Approval * 5).toNumber();
        let executionPhaseStartTime = new BigNumber(votingPhaseEndTime).toNumber();
        let executionPhaseEndTime = new BigNumber(votingPhaseEndTime).plus(duration?.Execution).toNumber();

        proposalData[item].submittedTime = submittedTime ? submittedTime : 0;
        proposalData[item].approvalPhaseTime = approvalPhaseTime ? approvalPhaseTime : 0;
        proposalData[item].votingPhaseStartTime = votingPhaseStartTime ? votingPhaseStartTime: 0;
        proposalData[item].votingPhaseEndTime = votingPhaseEndTime ? votingPhaseEndTime : 0;
        proposalData[item].executionPhaseStartTime = executionPhaseStartTime ? executionPhaseStartTime: 0;
        proposalData[item].executionPhaseEndTime = executionPhaseEndTime ? executionPhaseEndTime: 0;
    }
};

const getProposalStage = async (proposalData, getGovernance,executedProposals) => {
        let proposalRec = [];
        let status;

        for(let d = 0; d < proposalData.length; d++){
            if(proposalData[d].returnValues.proposalId == d+2){
                proposalRec[d] = await getGovernance.getProposalRecord(d+2)
                if(proposalRec[d].stage === ProposalStage.Expiration){
                     if (executedProposals.find((e) => new BigNumber(e.returnValues.proposalId).eq(proposalData[d].returnValues.proposalId))) {
                        status = "Approved"
                    }
                    else {
                        status = "Rejected"
                    }  
                }
                else {
                    status = "Referendum"
                }
             
                Proposals.update({ proposalId: d+2},{$set: {stage: proposalRec[d].stage, status: status}});
        }
    }
}


Meteor.methods({
    "proposals.getProposals": async function () {
        this.unblock()
   
        console.log("Start proposals.getProposals")

        let governance, getGovernance, executedProposals, getUpvoters, getTotalVotes, duration;
        let proposalQueuedEvent = {};
        let proposalData = [];

        try {
            governance = await kit._web3Contracts.getGovernance()
        }
        catch (error) {
            console.log("Error when getting _web3Contracts Governance Contract " + error)
        }

        try {
            proposalQueuedEvent = await governance.getPastEvents('ProposalQueued', { fromBlock: 0 })
            decodeInput(proposalData, proposalQueuedEvent); 
        }
        catch (error) {
            console.log("Error when getting the Governance Past Events " + error)
        }


        try {
            getGovernance = await kit.contracts.getGovernance()
        }
        catch (error) {
            console.log("Error when getting Governance Contract " + error)
        }

        try {
            duration = await getGovernance.stageDurations();
        }
        catch (error) {
            console.log("Error when getting Governance Durations " + error);
        }
   

        try {
            executedProposals = await governance.getPastEvents('ProposalExecuted', { fromBlock: 0 });
        }
        catch (error) {
            console.log("Error when getting Governance Executed Proposals " + error);
        }

        try {
            getUpvoters = await governance.getPastEvents('ProposalUpvoted', { fromBlock: 0 });
            saveUpvoteList(proposalData, getUpvoters);

            }
        catch (error) {
            console.log("Error when getting Governance Upvoted Proposals " + error);
            }

        try {
            getTotalVotes = await governance.getPastEvents('ProposalVoted', { fromBlock: 0 });
            saveProposalVotes(proposalData, getTotalVotes);

            }
        catch (error) {
            console.log("Error when getting Governance Voted Proposals " + error);
            }

            saveProposalDurations(proposalData,duration);
            getProposalStage(proposalData, getGovernance,executedProposals);


        for(let item = 0; item < proposalData.length; item++){

            const bulkProposals = Proposals.rawCollection().initializeUnorderedBulkOp();
            bulkProposals.find({transactionHash: proposalData[item]?.transactionHash}).upsert().updateOne({$set: proposalData[item]});
            
            if (bulkProposals.length > 0){
                bulkProposals.execute((err, result) => {
                    if (err){
                        console.log("Error when saving proposals " + err);
                    }
                    if (result){
                        console.log("Proposals saved!")
                    }
                });
            }

    }
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
