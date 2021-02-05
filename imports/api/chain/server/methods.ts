import { Meteor } from 'meteor/meteor';
import { Chain } from '../../chain/chain';
import { Accounts } from '../../accounts/accounts';
import { newKit } from '@celo/contractkit';

import PUB from '../../graphql/subscriptions';
import fetch from 'node-fetch'

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
    'chain.updateChain': async function (height) {
        this.unblock();

        let chainId, validators, epochSize, epochNumber, firstBlockNumberForEpoch, lastBlockNumberForEpoch, goldToken, stableToken;

        try {
            chainId = await web3.eth.net.getId();
        }
        catch (e) {
            console.log("Error when processing chainId " + e)
        }

        try {
            epochNumber = await kit.getEpochNumberOfBlock(height);
        }
        catch (e) {
            console.log("Error when updating Epoch Number " + e)
        }

        try {
            validators = await kit.contracts.getValidators();
        }
        catch (e) {
            console.log("Error when updating Validators Contract " + e)
        }

        try {
            epochSize = await validators.getEpochSize();
        }
        catch (e) {
            console.log("Error when updating Epoch Size " + e)
        }
        try {
            firstBlockNumberForEpoch = await kit.getFirstBlockNumberForEpoch(epochNumber);
        }
        catch (e) {
            console.log("Error when updating firstBlockNumberForEpoch " + e)
        }

        try {
            lastBlockNumberForEpoch = await kit.getLastBlockNumberForEpoch(epochNumber);
        }
        catch (e) {
            console.log("Error when updating lastBlockNumberForEpoch " + e)
        }

        try {
            goldToken = await kit.contracts.getGoldToken();
        }
        catch (e) {
            console.log("Error when processing Gold Token Contract " + e)
        }

        try {
            stableToken = await kit.contracts.getStableToken();
        }
        catch (e) {
            console.log("Error when processing Stable Token Contract  " + e)
        }


        try {
            Chain.upsert({ chainId: chainId }, {
                $set: {
                    walletCount: Accounts.find().count(),
                    epochNumber: epochNumber,
                    epochSize: epochSize.toNumber(),
                    firstBlockNumberForEpoch: firstBlockNumberForEpoch,
                    lastBlockNumberForEpoch: lastBlockNumberForEpoch,
                    celoTotalSupply: (await goldToken.totalSupply()).toNumber(),
                    cUSDTotalSupply: (await stableToken.totalSupply()).toNumber()
                }
            }, (error: any, result: any) => {
                let chainState = Chain.findOne({ chainId: chainId });
                PUB.pubsub.publish(PUB.CHAIN_UPDATED, { chainUpdated: chainState });
            });
            return height
        }
        catch (e) {
            console.log("Error when updating Chain Data" + e.response)
        }
    },

    'chain.updateCoin': async function () {
        // this.unblock();
        let url; 
        
        try{
          url  =  "https://api.coingecko.com/api/v3/simple/price?ids=celo-gold&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true"
        }
        catch(e){
            console.log("Error when updating the coin price " + e)
        }

        try{
            let response = await fetch(url)
                .then(function (response) {
                    if (response.ok) {
                        response.json().then(async (data) => {
                            let chainId: number;
                            try{
                                chainId = await web3.eth.net.getId();
                            }
                            catch(e){
                                console.log("Error when processing chainId " + e)
                            }
                            Chain.upsert({ chainId: chainId }, {
                                $set: {
                                    tokenPrice: {
                                        usd: data['celo-gold']?.usd,
                                        usdMarketCap: data['celo-gold']?.usd_market_cap,
                                        usd24hVol: data['celo-gold']?.usd_24h_vol,
                                        usd24hChange: data['celo-gold']?.usd_24h_change,
                                        lastUpdatedAt: data['celo-gold']?.last_updated_at
                                    }
                                }
                            }, (error: any, result: any) => {
                                const chainState = Chain.findOne({ chainId: chainId });
                                PUB.pubsub.publish(PUB.CHAIN_UPDATED, { chainUpdated: chainState });
                            });
                        })
                    }
                });
        }
        catch (e) {
            console.log("Error when updating Coin Data " + e);
        }
    },
    
    'chain.getCurrentValidatorSet': async function () {
        let validators, validatorSet;

        try{
            validators = await kit.contracts.getValidators();
        }
        catch(e){
            console.log("Error when getting Validators contract " + e)
        }
        try{
            validatorSet = await validators.currentValidatorAccountsSet();
        }
        catch(e){
            console.log("Error when getting current Validator Accounts Set " + e)
        }

        return validatorSet;
    }
})