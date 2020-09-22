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
        let electedValidatorGroup = await election.getActiveVotesForGroup("0x8a12caB622B8093208931fA008D12D6Ba5AF47E4")

        // console.log(registeredValidatorGroups.length)
        // console.log(registeredValidators.length)

        let electedGroup = [];
        console.log(electedValidatorSet.length)
        console.log(electedGroup.length)
        for (let d = 0; d < electedGroup.length; d++) {
            for (let c = 0; c < electedValidatorSet.length; c++) {

                if (electedGroup[d] != electedValidatorSet[c].affiliation) {
                    electedGroup[d + 1] = electedValidatorSet[c].affiliation
                }
                else {
                    return
                }
                console.log(electedGroup)

            }
        }
    }



});
