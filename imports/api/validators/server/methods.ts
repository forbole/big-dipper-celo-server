import { Meteor } from 'meteor/meteor'
import { ValidatorGroups } from '../../validator-groups/validator-groups'
import { Validators } from '../../validators/validators'
import { newKit } from '@celo/contractkit'


let kit = newKit(Meteor.settings.public.fornoAddress)

Meteor.methods({
    'validators.update': async function (latestHeight: number) {
        let valContract = await kit.contracts.getValidators()
        let valGroups = await valContract.getRegisteredValidatorGroups()
        let validators = await valContract.getRegisteredValidators()
        let lockedGold = await kit.contracts.getLockedGold()

        let epochNumber = await kit.getEpochNumberOfBlock(latestHeight)
        let lastEpochNumber = epochNumber - 1

        let election = await kit.contracts.getElection()

        let electedValidatorSet = await election.getElectedValidators(lastEpochNumber)

        // const epochVoterRewards = await election.getVoterRewards(
        //     "0x3c86b6a27a074c1c4cc904d8808a1c33078db4e6",
        //     lastEpochNumber,
        //     await election.getVoterShare("0x3c86b6a27a074c1c4cc904d8808a1c33078db4e6", latestHeight)
        // )
       

        for (let i in validators) {
            let data: { [k: string]: any } = {}
            data = validators[i] 
            data.score = validators[i].score.toNumber()
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
            data.commission = valGroups[i].commission.toNumber()
            data.nextCommission = valGroups[i].nextCommission.toNumber()
            data.nextCommissionBlock = valGroups[i].nextCommissionBlock.toNumber()
            data.slashingMultiplier = valGroups[i].slashingMultiplier.toNumber()
            data.lastSlashed = valGroups[i].lastSlashed.toNumber()
            data.members = valGroups[i].members

            for (let b in validators) {
                if (data.address === validators[b].address) {
                    data.score = validators[b].score.toNumber()
                }
            }


            for (let d = 0; d < electedValidatorSet.length; d++) {
                let counter = 0
                for (let e = 0; e < data.members.length; e++) {
                    if (electedValidatorSet[d].address === data.members[e]) {
                        data.electedValidators[counter] = electedValidatorSet[d].address
                    }
                    counter++
                }
            }


            data.lockedGoldAmount = (await lockedGold.getAccountTotalLockedGold(data.address)).toNumber()
            const votes = await election.getValidatorGroupVotes(data.address)
            data.votes = votes.votes.toNumber()
            data.votesAvailable = votes.votes.toNumber() + votes.capacity.toNumber()


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