import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit';
import ValidatorGroups from '../../validator-groups/validator-groups';
import { Validators } from '../validators';

const kit = newKit(Meteor.settings.public.fornoAddress);

const validatorsDetails = async (validators, attestation) => {
  for (const i in validators) {
    if (i) {
      let data: { [k: string]: any } = {
      };
      data = validators[i];
      data.score = validators[i] && validators[i].score ? validators[i].score.toNumber() : 0;

      try {
        const attestationCompleted = await (attestation?.getPastEvents('AttestationCompleted', {
          fromBlock: 0,
          filter: {
            issuer: validators[i].address,
          },
        }));
        const attestationRequested = await (attestation?.getPastEvents('AttestationIssuerSelected', {
          fromBlock: 0,
          filter: {
            issuer: validators[i].address,
          },
        }));
        data.attestationCompleted = attestationCompleted?.length;
        data.attestationRequested = attestationRequested?.length;
      } catch (e) {
        console.log(`Error when saving Attestation Completed and Requested ${e}`);
      }

      Meteor.call('accounts.update', validators[i].address);
      Meteor.call('accounts.update', validators[i].affiliation);
      Meteor.call('accounts.update', validators[i].signer);

      try {
        Validators.upsert({
          address: data.address,
        }, {
          $set: data,
        });
      } catch (e) {
        console.log('=== Error when upserting validator ===');
        console.log(e);
      }
    }
  }
};

const validatorScore = (validators, data) => {
  if (validators) {
    for (const b in validators) {
      if (data.address === validators[b].address) {
        data.score = validators[b].score.toNumber();
      }
    }
  }
};

const validatorRewards = async (data, valContract, epochNumber) => {
  const rewardsData: { [index: string]: any } = {
  };
  const blockNumber = await kit.getLastBlockNumberForEpoch(epochNumber - 1);
  if (blockNumber > 0) {
    for (const t in data.members) {
      if (t) {
        let validatorEpochPaymentDistributed;
        try {
          validatorEpochPaymentDistributed = valContract ? await valContract?.getPastEvents('ValidatorEpochPaymentDistributed', {
            fromBlock: blockNumber,
            toBlock: blockNumber,
            filter: {
              validator: data.members[t],
            },
          }) : {
          };
        } catch (e) {
          console.log(`Error when getting validatorEpochPaymentDistributed ${e}`);
        }

        try {
          rewardsData[t] = {
            blockNumber: validatorEpochPaymentDistributed[0]?.blockNumber ? validatorEpochPaymentDistributed[0]?.blockNumber : 0,
            validatorAddress: validatorEpochPaymentDistributed[0]?.returnValues?.validator ? validatorEpochPaymentDistributed[0]?.returnValues?.validator : '',
            validatorReward: validatorEpochPaymentDistributed[0]?.returnValues?.validatorPayment ? validatorEpochPaymentDistributed[0]?.returnValues?.validatorPayment : 0,
            groupAddress: validatorEpochPaymentDistributed[0]?.returnValues?.group ? validatorEpochPaymentDistributed[0]?.returnValues?.group : '',
            groupReward: validatorEpochPaymentDistributed[0]?.returnValues?.groupPayment ? validatorEpochPaymentDistributed[0]?.returnValues?.groupPayment : '',
          };
        } catch (e) {
          console.log(`Error when obtaining validator rewards ${e}`);
        }

        ValidatorGroups.update({
          address: data.address,
        }, {
          $set: {
            rewards: rewardsData[t],
          },
        });
      }
    }
  }
};

const electedValidators = (electedValidatorSet, data) => {
  if (electedValidatorSet) {
    let counter = 0;
    for (let d = 0; d < electedValidatorSet.length; d++) {
      for (let e = 0; e < data.members.length; e++) {
        if (electedValidatorSet[d].address === data.members[e]) {
          data.electedValidators[counter] = electedValidatorSet[d].address;
          counter++;
        }
      }
    }
    return data.electedValidators;
  }
};

const validatorGroupsDetails = async (valGroups, validators, epochNumber, valContract, electedValidatorSet, lockedGold, election) => {
  for (const i in valGroups) {
    if (i) {
      let data: { [k: string]: any } = {
      };
      let votes;

      data = valGroups[i];
      data.commission = valGroups && valGroups[i] && valGroups[i].commission ? valGroups[i].commission.toNumber() : 0;
      data.nextCommission = valGroups && valGroups[i] && valGroups[i].nextCommission ? valGroups[i].nextCommission.toNumber() : 0;
      data.nextCommissionBlock = valGroups && valGroups[i] && valGroups[i].nextCommissionBlock ? valGroups[i].nextCommissionBlock.toNumber() : 0;
      data.slashingMultiplier = valGroups && valGroups[i] && valGroups[i].slashingMultiplier ? valGroups[i].slashingMultiplier.toNumber() : 0;
      data.lastSlashed = valGroups && valGroups[i] && valGroups[i].lastSlashed ? valGroups[i].lastSlashed.toNumber() : null;
      data.members = valGroups && valGroups[i] && valGroups[i].members ? valGroups[i].members : null;
      data.electedValidators = {
      };

      // Get Validator Score
      validatorScore(validators, data);
      // Get Validator Total Rewards Value
      validatorRewards(data, valContract, epochNumber);
      // Get list of Elected Validators for current epoch
      electedValidators(await electedValidatorSet, data);

      try {
        data.lockedGoldAmount = (await lockedGold.getAccountTotalLockedGold(data.address)).toNumber();
      } catch (error) {
        console.log(`Error when getting Account Total Locked Gold ${error}`);
      }

      try {
        votes = await election.getValidatorGroupVotes(data.address);
      } catch (error) {
        console.log(`Error when getting Validator Group Votes ${error}`);
      }

      data.votes = votes && votes.votes ? votes.votes.toNumber() : 0;
      data.votesAvailable = votes && votes.votes && votes.capacity ? votes.votes.toNumber() + votes.capacity.toNumber() : 0;

      try {
        ValidatorGroups.upsert({
          address: data.address,
        }, {
          $set: data,
        });
      } catch (e) {
        console.log('=== Error when upserting validator group ===');
        console.log(e);
      }
    }
  }
};

Meteor.methods({
  'validators.update': async function (latestHeight: number) {
    this.unblock();
    let valContract; let valGroups; let validators; let lockedGold; let epochNumber; let election; let electedValidatorSet; let
      attestation;

    try {
      valContract = await kit.contracts.getValidators();
    } catch (error) {
      console.log(`Error when getting Validators Contract  ${error}`);
    }

    try {
      valGroups = await valContract.getRegisteredValidatorGroups();
    } catch (error) {
      console.log(`Error when getting Registered Validators Groups ${error}`);
    }

    try {
      validators = await valContract.getRegisteredValidators();
    } catch (error) {
      console.log(`Error when getting Registered Validators ${error}`);
    }

    try {
      lockedGold = await kit.contracts.getLockedGold();
    } catch (error) {
      console.log(`Error when getting Validators Locked Gold Contract ${error}`);
    }

    try {
      epochNumber = await kit.getEpochNumberOfBlock(latestHeight);
    } catch (error) {
      console.log(`Error when getting Epoch Number of Block  ${error}`);
    }

    try {
      election = await kit.contracts.getElection();
    } catch (error) {
      console.log(`Error when getting Election Contract  ${error}`);
    }

    try {
      const lastEpochNumber = epochNumber - 1;
      electedValidatorSet = await election.getElectedValidators(lastEpochNumber);
    } catch (error) {
      console.log(`Error when getting Elected Validators Set  ${error}`);
    }

    try {
      attestation = await kit.contracts.getAttestations();
    } catch (error) {
      console.log(`Error when getting Attestations Contract  ${error}`);
    }

    // Query and store validators latest details
    validatorsDetails(validators, attestation);
    // Query and store validator groups latest details
    validatorGroupsDetails(valGroups, validators, epochNumber, valContract, electedValidatorSet, lockedGold, election);
  },

});
