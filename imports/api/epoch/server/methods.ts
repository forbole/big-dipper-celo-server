import { Meteor } from 'meteor/meteor'
import { Epoch } from '../../epoch/epoch'
import { newKit } from '@celo/contractkit'

let kit = newKit(Meteor.settings.public.fornoAddress)

Meteor.methods({
    'epoch.update': async function (latestHeight: number) {

        let epochSize = await kit.getEpochSize()
        let epochNumber = await kit.getEpochNumberOfBlock(latestHeight)
        let firstBlockNumberForEpoch = await kit.getFirstBlockNumberForEpoch(epochNumber)
        let lastBlockNumberForEpoch = await kit.getLastBlockNumberForEpoch(epochNumber)
        // let currentBlockInEpoch = latestHeight - firstBlockNumberForEpoch
        // let remainingEpochTime = lastBlockNumberForEpoch - latestHeight

        try {
            Epoch.upsert({}, { $set: { epochSize: epochSize, epochNumber: epochNumber, firstBlockNumberForEpoch: firstBlockNumberForEpoch, lastBlockNumberForEpoch: lastBlockNumberForEpoch } })
        }
        catch (e) {
            console.log("=== Error when updating Epoch ===")
            console.log(e)
        }

    }
})