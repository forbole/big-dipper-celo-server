import { Meteor } from 'meteor/meteor';
import { ValidatorGroups } from '../../validator-groups/validator-groups';
import { Validators } from '../../validators/validators';
import { newKit } from '@celo/contractkit';

// import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);

Meteor.methods({
    'validators.update': async function(){
        // this.unblock();
        let valContract = await kit.contracts.getValidators();
        let valGroups = await valContract.getRegisteredValidatorGroups();
        for (let i in valGroups){
            let data: {[k: string]: any} = {};
            data = valGroups[i];
            data.commission = valGroups[i].commission.toNumber();
            data.nextCommission = valGroups[i].nextCommission.toNumber();
            data.nextCommissionBlock = valGroups[i].nextCommissionBlock.toNumber();
            data.slashingMultiplier = valGroups[i].slashingMultiplier.toNumber();
            data.lastSlashed = valGroups[i].lastSlashed.toNumber();
            
            for (let j in valGroups[i].members){
                try{
                    let val = await valContract.getValidator(valGroups[i].members[j]);
                    let valData: { [k: string]: any } = {};
                    valData = val;
                    valData.score = val.score.toNumber();
                    valData.validatorGroup = valGroups[i].address;
                    try{
                        Validators.upsert({ address: valData.address}, {$set:valData})
                        // Meteor.call("accounts.update", valData.address)
                        // Meteor.call("accounts.update", valData.affiliation)
                        // Meteor.call("accounts.update", valData.signer)
                    }
                    catch(e){
                        console.log(e);
                    }
                }
                catch(e){
                    console.log(e);
                }
            }
            try{
                ValidatorGroups.upsert({address:data.address}, {$set:data});
            }
            catch(e){
                console.log(e);
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