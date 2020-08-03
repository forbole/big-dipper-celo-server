import { Meteor } from 'meteor/meteor'
import { ValidatorGroups } from '../../validator-groups/validator-groups'
import { Validators } from '../../validators/validators'
import { newKit } from '@celo/contractkit'

// import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress)

Meteor.methods({
    'validators.update': async function(){
        let valContract = await kit.contracts.getValidators()
        let valGroups = await valContract.getRegisteredValidatorGroups()
        let validators = await valContract.getRegisteredValidators()

        for (let i in validators){
            let data: {[k: string]: any} = {}
            data = validators[i]
            data.score = validators[i].score.toNumber()
            Meteor.call('accounts.update', validators[i].address);
            Meteor.call('accounts.update', validators[i].affiliation);
            Meteor.call('accounts.update', validators[i].signer);
        
            try{
                Validators.upsert({ address: data.address}, {$set:data})
            }
            catch(e){
                console.log("=== Error when upserting validator ===")
                console.log(e)
            }
        }

        for (let i in valGroups){
            let data: {[k: string]: any} = {}
            data = valGroups[i]
            data.commission = valGroups[i].commission.toNumber()
            data.nextCommission = valGroups[i].nextCommission.toNumber()
            data.nextCommissionBlock = valGroups[i].nextCommissionBlock.toNumber()
            data.slashingMultiplier = valGroups[i].slashingMultiplier.toNumber()
            data.lastSlashed = valGroups[i].lastSlashed.toNumber()
            
            try{
                ValidatorGroups.upsert({address:data.address}, {$set:data})
            }
            catch(e){
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