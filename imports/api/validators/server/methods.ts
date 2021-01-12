import { Meteor } from 'meteor/meteor'
import { ValidatorGroups } from '../../validator-groups/validator-groups'
import { Validators } from '../../validators/validators'
import { newKit } from '@celo/contractkit'
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'

let kit = newKit(Meteor.settings.public.fornoAddress)
// let web3: Web3 = new Web3("https://alfajores-forno.celo-testnet.org")
// let kit2 = newKitFromWeb3(web3)

Meteor.methods({
    'validators.update': async function (latestHeight: number) {
        this.unblock()
        let valContract, valGroups, validators, lockedGold, epochNumber, election, electedValidatorSet, attestation, blockNum;
       
        try {
            valContract = await kit.contracts.getValidators()
            valGroups = await valContract.getRegisteredValidatorGroups()
            validators = await valContract.getRegisteredValidators()
            lockedGold = await kit.contracts.getLockedGold()
            epochNumber = await kit.getEpochNumberOfBlock(latestHeight)
            election = await kit.contracts.getElection()
            electedValidatorSet = await election.getElectedValidators(epochNumber)
            attestation = await kit.contracts.getAttestations()
            
        }
        catch (error) {
            console.log("Error when getting Validators Contract  " + error)
        }

        for (let i in validators) {
            let data: { [k: string]: any } = {}
            data = validators[i]
            data.score = validators[i] && validators[i].score ? validators[i].score.toNumber() : 0;
            try{
                let attestationCompleted = await (attestation?.getPastEvents('AttestationCompleted', {
                    fromBlock: 0,
                    filter: {
                        issuer: validators[i].address,
                    }
                }))
                let attestationRequested = await (attestation?.getPastEvents('AttestationIssuerSelected', {
                    fromBlock: 0,
                    filter: {
                        issuer: validators[i].address,
                    }
                }))
                data.attestationCompleted = attestationCompleted?.length 
                data.attestationRequested = attestationRequested?.length 
            }
            catch(e){
                console.log("Error when saving Attestation Completed and Requested " + e)
            }
         
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
            let rewardsData: { [index: string]: any } = {}

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

            for(let t in data.members){
                blockNum = await kit.getLastBlockNumberForEpoch(epochNumber - 1)
                let validatorEpochPaymentDistributed;
               
                try{
                    validatorEpochPaymentDistributed = valContract ? await valContract?.getPastEvents('ValidatorEpochPaymentDistributed', {
                        fromBlock: blockNum,
                        toBlock: blockNum,
                        filter: {
                            validator: data.members[t],
                        }
                    }) : {}
                }
                catch(e){
                    console.log('Error when getting validatorEpochPaymentDistributed ' + e)
                }
                
                rewardsData[t]={
                    blockNumber: validatorEpochPaymentDistributed && validatorEpochPaymentDistributed[0].blockNumber ? validatorEpochPaymentDistributed[0].blockNumber : 0,
                    validatorAddress: validatorEpochPaymentDistributed && validatorEpochPaymentDistributed[0].returnValues && validatorEpochPaymentDistributed[0].returnValues.validator ? validatorEpochPaymentDistributed[0].returnValues.validator : '',
                    validatorReward: validatorEpochPaymentDistributed && validatorEpochPaymentDistributed[0].returnValues && validatorEpochPaymentDistributed[0].returnValues.validatorPayment ? validatorEpochPaymentDistributed[0].returnValues.validatorPayment : 0,
                    groupAddress: validatorEpochPaymentDistributed && validatorEpochPaymentDistributed[0].returnValues && validatorEpochPaymentDistributed[0].returnValues.group ? 
                    validatorEpochPaymentDistributed[0].returnValues.group : '',
                    groupReward: validatorEpochPaymentDistributed && validatorEpochPaymentDistributed[0].returnValues && validatorEpochPaymentDistributed[0].returnValues.groupPayment ?
                     validatorEpochPaymentDistributed[0].returnValues.groupPayment : ''
             
            }
        }
            data.rewards = rewardsData

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