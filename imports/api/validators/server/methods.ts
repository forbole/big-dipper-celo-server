import { Meteor } from 'meteor/meteor'
import { ValidatorGroups } from '../../validator-groups/validator-groups'
import { Validators } from '../../validators/validators'
import { newKit } from '@celo/contractkit'
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'

let kit = newKit(Meteor.settings.public.fornoAddress)
let web3: Web3 = new Web3("https://alfajores-forno.celo-testnet.org")
let kit2 = newKitFromWeb3(web3)

Meteor.methods({
    'validators.update': async function (latestHeight: number) {

        let valContract, valGroups, validators, lockedGold, epochNumber, election, electedValidatorSet, epochRewards;
        try {
            valContract = await kit.contracts.getValidators()
            valGroups = await valContract.getRegisteredValidatorGroups()
            validators = await valContract.getRegisteredValidators()
            lockedGold = await kit.contracts.getLockedGold()
            epochNumber = await kit.getEpochNumberOfBlock(latestHeight)
            election = await kit.contracts.getElection()
            electedValidatorSet = await election.getElectedValidators(epochNumber)
            epochRewards = await kit2._web3Contracts.getEpochRewards()
        }
        catch (error) {
            console.log("Error when getting Validators Contract " + error)
        }
        let voterRewards;
        let voterShare;
        let getVoter;
        let groupVoterRewards;
        let rewardsMultiplier;
        let targetValidatorEpochPayment;
        try{
            // voterRewards = await election.getVoterRewards("0x5edfCe0bad47e24E30625c275457F5b4Bb619241", 126)
            // voterShare = await election.getVoterShare("0x5edfCe0bad47e24E30625c275457F5b4Bb619241")
            // getVoter = await election.getVoter("0x5edfCe0bad47e24E30625c275457F5b4Bb619241")
            // groupVoterRewards = await election.getGroupVoterRewards(126)
            targetValidatorEpochPayment = await epochRewards.methods.targetValidatorEpochPayment().call()
            rewardsMultiplier = await epochRewards.methods.getRewardsMultiplier().call({}, latestHeight - 1)
        
          
        }
        catch(e){
            console.log("Error when getting epochRewards " + e) 
        }

        // console.log("~~~~~~~~~~~")  
        // console.log(voterRewards)
        // // console.log(voterRewards[0].addressPayment.toNumber())
        // console.log(voterShare)
        // console.log(getVoter)
        // console.log(groupVoterRewards)
        // console.log(groupVoterRewards[0].groupVoterPayment.toNumber())
        // console.log(at)
        // console.log(finalRewards)
        // console.log("~~~~~~~~~~~")

        // const epochVoterRewards = await election.getVoterRewards(
        //     "0x3c86b6a27a074c1c4cc904d8808a1c33078db4e6",
        //     lastEpochNumber,
        //     await election.getVoterShare("0x3c86b6a27a074c1c4cc904d8808a1c33078db4e6", latestHeight)
        // )
        for (let i in validators) {
            let data: { [k: string]: any } = {}
            data = validators[i]
            data.score = validators[i] && validators[i].score ? validators[i].score.toNumber() : 0;
            Meteor.call('accounts.update', validators[i].address);
            Meteor.call('accounts.update', validators[i].affiliation);
            Meteor.call('accounts.update', validators[i].signer);

            try {
                Validators.upsert({ address: data.address }, { $set: data })
            }
            catch (e) {
                console.log("=== Error when upserting validator ===")
                console.log(e)
            }
        }



        for (let i in valGroups) {
            let data: { [k: string]: any } = {}
            data = valGroups[i]
            data.commission = valGroups && valGroups[i] && valGroups[i].commission ? valGroups[i].commission.toNumber() : 0;
            data.nextCommission = valGroups && valGroups[i] && valGroups[i].nextCommission ? valGroups[i].nextCommission.toNumber() : 0;
            data.nextCommissionBlock = valGroups && valGroups[i] && valGroups[i].nextCommissionBlock ? valGroups[i].nextCommissionBlock.toNumber() : 0;
            data.slashingMultiplier = valGroups && valGroups[i] && valGroups[i].slashingMultiplier ? valGroups[i].slashingMultiplier.toNumber() : 0;
            data.lastSlashed = valGroups && valGroups[i] && valGroups[i].lastSlashed ? valGroups[i].lastSlashed.toNumber() : null;
            data.members = valGroups && valGroups[i] && valGroups[i].members ? valGroups[i].members : null;

            for (let b in validators) {
                if (data.address === validators[b].address) {
                    data.score = validators[b].score.toNumber()
                }
            }

            data.electedValidators = {}

            for (let d = 0; d < electedValidatorSet.length; d++) {
                
                let counter = 0
                for (let e = 0; e < data.members.length; e++) {
                    if (electedValidatorSet[d].address === data.members[e]) {
                        data.electedValidators[counter] = electedValidatorSet[d].address
                        counter++
                    }
                }
            }

            try {
                data.lockedGoldAmount = (await lockedGold.getAccountTotalLockedGold(data.address)).toNumber()
                
            }
            catch (error) {
                console.log("Error when getting Account Total Locked Gold " + error)
            }

            let votes;

            try {
                votes = await election.getValidatorGroupVotes(data.address)
            }
            catch (error) {
                console.log("Error when getting Validator Group Votes " + error)
            }

            data.votes = votes && votes.votes ? votes.votes.toNumber() : 0;
            data.votesAvailable = votes && votes.votes && votes.capacity ? votes.votes.toNumber() + votes.capacity.toNumber() : 0;
            data.targetValidatorEpochPayment = targetValidatorEpochPayment ? targetValidatorEpochPayment : 0;
            data.rewardsMultiplier = rewardsMultiplier ? rewardsMultiplier : 0;

            try {
                ValidatorGroups.upsert({ address: data.address }, { $set: data })
            }
            catch (e) {
                console.log("=== Error when upserting validator group ===")
                console.log(e)
            }
        }
        // console.log((await validators.getEpochNumber()).toNumber());
        // console.log();
        // console.log(await validators.getAccountLockedGoldRequirement())
        // let chainId = await web3.eth.net.getId();
        // Chain.upsert({chainId:chainId}, {$set:{latestHeight:height}},(error, result) => {
        //     let chainState = Chain.findOne({chainId:chainId});
        //     PUB.pubsub.publish(PUB.CHAIN_UPDATED, { chainUpdated: chainState });
        // });
    }
})