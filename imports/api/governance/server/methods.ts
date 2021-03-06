import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit';
import BigNumber from 'bignumber.js';
import { ProposalStage } from '@celo/contractkit/lib/wrappers/Governance';
import * as abiDecoder from 'abi-decoder';
import Election from '../election';
import Proposals from '../proposals';
import Contracts from '../../contracts/contracts';
import Blocks from '../../blocks/blocks';

const kit = newKit(Meteor.settings.public.fornoAddress);
const { web3 } = kit;

// Decode tx input to obtain descriptionURL
const decodeInput = async (proposalData, proposalQueuedEvent) => {
  for (let c = 1; c <= Object.keys(proposalQueuedEvent).length; c++) {
    let getTransaction;
    try {
      getTransaction = proposalQueuedEvent[c]?.transactionHash ? await web3.eth.getTransaction((proposalQueuedEvent[c]?.transactionHash)) : null;
    } catch (e) {
      console.log(`Error when gettimg trasction for proposal ${c} ${e}`);
    }
    const contract = Contracts.findOne({
      address: proposalQueuedEvent[c]?.address,
    });
    abiDecoder.addABI(contract?.ABI);

    if (getTransaction) {
      const decodedInput = abiDecoder.decodeMethod(getTransaction?.input);
      proposalData[c - 1] = proposalQueuedEvent[c] ?? null;
      proposalData[c - 1].proposalId = parseInt(proposalQueuedEvent[c]?.returnValues?.proposalId) < 7 ? parseInt(proposalQueuedEvent[c]?.returnValues?.proposalId) - 1 : parseInt(proposalQueuedEvent[c]?.returnValues?.proposalId);

      proposalData[c - 1].input = decodedInput ?? null;
    }
  }
};

// Save list and total number of votes received during Referendum Phase
const saveProposalVotes = (proposalData, getTotalVotes) => {
  for (let item = 0; item < proposalData.length; item++) {
    let votedAbstain = 0;
    let votedNo = 0;
    let votedYes = 0;
    const votedAbstainList = [];
    const votedNoList = [];
    const votedYesList = [];
    let counterAbstain = 0;
    let counterNo = 0;
    let counterYes = 0;
    const votes = [];

    // Abstain -> value == 1
    // No -> value == 2
    // Yes ->  value == 3
    for (let s = 0; s < getTotalVotes.length; s++) {
      if (parseInt(getTotalVotes[s].returnValues.proposalId) === item + 2 && parseInt(getTotalVotes[s].returnValues.value) === 1) {
        votedAbstain += parseFloat(getTotalVotes[s].returnValues.weight);
        votedAbstainList[counterAbstain] = getTotalVotes[s];
        votedAbstainList[counterAbstain].voteType = 'Abstain';
        counterAbstain++;
      } else if (parseInt(getTotalVotes[s].returnValues.proposalId) === item + 2 && parseInt(getTotalVotes[s].returnValues.value) === 2) {
        votedNo += parseFloat(getTotalVotes[s].returnValues.weight);
        votedNoList[counterNo] = getTotalVotes[s];
        votedNoList[counterNo].voteType = 'No';
        counterNo++;
      } else if (parseInt(getTotalVotes[s].returnValues.proposalId) === item + 2 && parseInt(getTotalVotes[s].returnValues.value) === 3) {
        votedYes += parseFloat(getTotalVotes[s].returnValues.weight);
        votedYesList[counterYes] = getTotalVotes[s];
        votedYesList[counterYes].voteType = 'Yes';
        counterYes++;
      }
      const allVotesTotal = [...votedYesList, ...votedAbstainList, ...votedNoList];
      const totalVotesList = {
        Abstain: votedAbstainList,
        No: votedNoList,
        Yes: votedYesList,
        All: allVotesTotal,
      };

      const totalVotesValue = votedAbstain + votedNo + votedYes;
      const totalVotes = {
        Abstain: votedAbstain,
        No: votedNo,
        Yes: votedYes,
        Total: totalVotesValue,
      };
      proposalData[item].votes = totalVotes;
      proposalData[item].totalVotesList = totalVotesList;
    }
  }
};

// Save list of upvotes received when the proposal was in the queue
const saveUpvoteList = (proposalData, getUpvoters) => {
  for (let item = 0; item < proposalData.length; item++) {
    const upvotersList = {
    };
    let counter = 0;

    for (let s = 0; s < getUpvoters.length; s++) {
      let blockDetails;
      if (parseInt(getUpvoters[s].returnValues.proposalId) === item + 2) {
        upvotersList[counter] = getUpvoters[s];
        blockDetails = Blocks.findOne({
          hash: upvotersList[counter].blockHash,
        });
        upvotersList[counter].timestamp = blockDetails?.timestamp;
        counter++;
      }
      proposalData[item].upvoteList = upvotersList;
    }
  }
};

// Save proposals duration for each phase
const saveProposalDurations = (proposalData, duration) => {
  for (let item = 0; item < proposalData.length; item++) {
    const submittedTime = new BigNumber(proposalData[item]?.returnValues?.timestamp).toNumber();

    // Approval phase lasts 1 day and if the proposal is not approved in this window, it is considered expired.
    const approvalPhaseTime = new BigNumber(submittedTime).plus(duration?.Approval).toNumber();

    // Referendum Phase (voting) lasts five days
    // Calculate day 5 of Referendum Phase
    const votingPhaseEndTime = new BigNumber(approvalPhaseTime).plus(duration.Referendum).toNumber();
    // Calculate day 1 of Referendum Phase
    const votingPhaseStartTime = new BigNumber(votingPhaseEndTime).minus(duration?.Approval * 5).toNumber();

    // Execution Phase lasts maximum of three days
    // Calculate day 1 of Execution Phase
    const executionPhaseStartTime = new BigNumber(votingPhaseEndTime).toNumber();
    // Calculate day 3 of Execution Phase
    const executionPhaseEndTime = new BigNumber(votingPhaseEndTime).plus(duration?.Execution).toNumber();

    proposalData[item].submittedTime = submittedTime || 0;
    proposalData[item].approvalPhaseTime = approvalPhaseTime || 0;
    proposalData[item].votingPhaseStartTime = votingPhaseStartTime || 0;
    proposalData[item].votingPhaseEndTime = votingPhaseEndTime || 0;
    proposalData[item].executionPhaseStartTime = executionPhaseStartTime || 0;
    proposalData[item].executionPhaseEndTime = executionPhaseEndTime || 0;
  }
};

// Save proposal stage and status
const getProposalStage = async (proposalData, getGovernance, executedProposals) => {
  const proposalRec = [];
  let status;

  for (let d = 0; d < proposalData?.length; d++) {
    if (parseInt(proposalData[d]?.returnValues?.proposalId) === d + 2) {
      proposalRec[d] = await getGovernance.getProposalRecord(d + 2);
      if (proposalRec[d]?.stage === ProposalStage.Expiration) {
        if (proposalRec[d]?.stage === ProposalStage.Referendum) {
          status = 'Referendum';
        }

        if (proposalRec[d]?.stage === ProposalStage.Execution) {
          status = 'Execution';
        }

        if (executedProposals.find((e) => new BigNumber(e?.returnValues?.proposalId).eq(proposalData[d]?.returnValues?.proposalId))) {
          status = 'Approved';
        } else {
          status = 'Rejected';
        }
      }

      try {
        Proposals.update({
          proposalId: d + 2,
        }, {
          $set: {
            stage: proposalRec[d]?.stage, status,
          },
        });
      } catch (e) {
        console.log(`Error when updating Proposal Stage and Status ${e}`);
      }
    }
  }
};

Meteor.methods({
  'proposals.getProposals': async function () {
    this.unblock();

    console.log('Start proposals.getProposals');

    let governance; let getGovernance; let executedProposals; let getUpvoters; let getTotalVotes; let
      duration;
    let proposalQueuedEvent = {
    };
    const proposalData = [];

    try {
      governance = await kit._web3Contracts.getGovernance();
    } catch (error) {
      console.log(`Error when getting _web3Contracts Governance Contract ${error}`);
    }

    try {
      proposalQueuedEvent = await governance.getPastEvents('ProposalQueued', {
        fromBlock: 0,
      });
      decodeInput(proposalData, proposalQueuedEvent);
    } catch (error) {
      console.log(`Error when getting the Governance Past Events ${error}`);
    }

    try {
      getGovernance = await kit.contracts.getGovernance();
    } catch (error) {
      console.log(`Error when getting Governance Contract ${error}`);
    }

    try {
      duration = await getGovernance.stageDurations();
    } catch (error) {
      console.log(`Error when getting Governance Durations ${error}`);
    }

    try {
      executedProposals = await governance.getPastEvents('ProposalExecuted', {
        fromBlock: 0,
      });
    } catch (error) {
      console.log(`Error when getting Governance Executed Proposals ${error}`);
    }

    try {
      getUpvoters = await governance.getPastEvents('ProposalUpvoted', {
        fromBlock: 0,
      });
    } catch (error) {
      console.log(`Error when getting Governance Upvoted Proposals ${error}`);
    }

    try {
      getTotalVotes = await governance.getPastEvents('ProposalVoted', {
        fromBlock: 0,
      });
    } catch (error) {
      console.log(`Error when getting Governance Voted Proposals ${error}`);
    }

    saveUpvoteList(proposalData, getUpvoters);
    saveProposalVotes(proposalData, getTotalVotes);
    saveProposalDurations(proposalData, duration);
    getProposalStage(proposalData, getGovernance, executedProposals);

    for (let item = 0; item < proposalData.length; item++) {
      const bulkProposals = Proposals.rawCollection().initializeUnorderedBulkOp();
      bulkProposals.find({
        transactionHash: proposalData[item]?.transactionHash,
      }).upsert().updateOne({
        $set: proposalData[item],
      });

      if (bulkProposals.length > 0) {
        bulkProposals.execute((err, result) => {
          if (err) {
            console.log(`Error when saving proposals ${err}`);
          }
          if (result) {
            console.log('Proposals saved!');
          }
        });
      }
    }
    return proposalData;
  },

  'election.update': async function (latestHeight: number) {
    this.unblock();
    let validatorsData; let registeredValidatorGroups; let registeredValidators; let epochNumber; let election; let electedValidatorSet; let
      electedGroupSet;
    const electedGroup = [];

    try {
      validatorsData = await kit.contracts.getValidators();
    } catch (error) {
      console.log(`Error when getting Validators Contract ${error}`);
    }

    try {
      registeredValidatorGroups = await validatorsData.getRegisteredValidatorGroups();
    } catch (error) {
      console.log(`Error when getting registered Validator Groups ${error}`);
    }

    try {
      registeredValidators = await validatorsData.getRegisteredValidators();
    } catch (error) {
      console.log(`Error when getting registered Validators ${error}`);
    }

    try {
      epochNumber = await kit.getEpochNumberOfBlock(latestHeight);
    } catch (error) {
      console.log(`Error when getting Epoch Number ${error}`);
    }

    try {
      election = await kit.contracts.getElection();
    } catch (error) {
      console.log(`Error when getting Election Contract ${error}`);
    }

    try {
      electedValidatorSet = await election.getElectedValidators(epochNumber);
    } catch (error) {
      console.log(`Error when getting Elected Validators Set (Governance) ${error}`);
    }

    for (let c = 0; c < electedValidatorSet.length; c++) {
      electedGroup[c] = electedValidatorSet[c].affiliation;
    }

    for (let c = 0; c < electedValidatorSet.length; c++) {
      electedGroupSet = Array.from(new Set(electedGroup));
    }

    try {
      Election.upsert({
      }, {
        $set: {
          registeredValidators: registeredValidators.length, electedValidators: electedValidatorSet.length, registeredValidatorGroups: registeredValidatorGroups.length, electedValidatorGroups: electedGroupSet.length,
        },
      });
    } catch (e) {
      console.log('=== Error when upserting election ===');
      console.log(e);
    }
  },
});
