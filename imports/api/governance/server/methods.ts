import { Meteor } from "meteor/meteor"
import { newKit } from "@celo/contractkit"
import { Election } from "../../governance/election"

import PUB from "../../graphql/subscriptions"

let kit = newKit(Meteor.settings.public.fornoAddress)
let web3 = kit.web3

Meteor.methods({
    'election.update': async function (latestHeight: number) {

        let validatorsData = await kit.contracts.getValidators()
        let registeredValidatorGroups = await validatorsData.getRegisteredValidatorGroups()
        let registeredValidators = await validatorsData.getRegisteredValidators()

        let epochNumber = await kit.getEpochNumberOfBlock(latestHeight)
        let lastEpochNumber = epochNumber - 1

        let election = await kit.contracts.getElection()

        let electedValidatorSet = await election.getElectedValidators(lastEpochNumber)

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
