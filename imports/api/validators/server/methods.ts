import { Meteor } from 'meteor/meteor'
import { ValidatorGroups } from '../../validator-groups/validator-groups'
import { Validators } from '../../validators/validators'
import { newKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import e from 'express'
import { ElectionWrapper } from '@celo/contractkit/lib/wrappers/Election'
import { ElectionResultsCache } from "@celo/celocli/lib/utils/election"


let kit = newKit(Meteor.settings.public.fornoAddress)

Meteor.methods({
    'validators.update': async function (latestHeight) {
        let valContract = await kit.contracts.getValidators()
        let valGroups = await valContract.getRegisteredValidatorGroups()
        let validators = await valContract.getRegisteredValidators()
        let lockedGold = await kit.contracts.getLockedGold()

        let epochNumber = await kit.getEpochNumberOfBlock(latestHeight) - 1
        let election = await kit.contracts.getElection()

        // let voter = await election.getVoter("0x01b2b83fdf26afc3ca7062c35bc68c8dde56db04")

        const epochVoterRewards = await election.getVoterRewards(
            "0x3c86b6a27a074c1c4cc904d8808a1c33078db4e6",
            epochNumber,
            await election.getVoterShare("0x3c86b6a27a074c1c4cc904d8808a1c33078db4e6", latestHeight)
        )

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

            const electedValidatorSet = await election.getElectedValidators(epochNumber)  //100 in total


            for (let d in electedValidatorSet) {
                for (let e in data.members) {
                    if (electedValidatorSet[d].address === data.members[e]) {
                        data.electedValidators = true
                    }

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