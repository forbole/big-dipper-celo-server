import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Chain } from '../../chain/chain';
import { Accounts } from '../../accounts/accounts';
import { newKit } from '@celo/contractkit';

import PUB from '../../graphql/subscriptions';

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
    'chain.updateChain': async function (height) {
        this.unblock();
        try {
            const chainId = await web3.eth.net.getId();
            const epochNumber = await kit.getEpochNumberOfBlock(height);
            const validators = await kit.contracts.getValidators();
            const epochSize = await validators.getEpochSize();
            const goldToken = await kit.contracts.getGoldToken();
            const stableToken = await kit.contracts.getStableToken();
            Chain.upsert({ chainId: chainId }, {
                $set: {
                    walletCount: Accounts.find().count(),
                    epochNumber: epochNumber,
                    epochSize: epochSize.toNumber(),
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
        const url = "https://api.coingecko.com/api/v3/simple/price?ids=celo-gold&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true"
        let response = HTTP.get(url);
        try {
            if (response.statusCode == 200) {
                const chainId = await web3.eth.net.getId();
                Chain.upsert({ chainId: chainId }, {
                    $set: {
                        tokenPrice: {
                            usd: response.data['celo-gold'].usd,
                            usdMarketCap: response.data['celo-gold'].usd_market_cap,
                            usd24hVol: response.data['celo-gold'].usd_24h_vol,
                            usd24hChange: response.data['celo-gold'].usd_24h_change,
                            lastUpdatedAt: response.data['celo-gold'].last_updated_at
                        }
                    }
                }, (error: any, result: any) => {
                    const chainState = Chain.findOne({ chainId: chainId });
                    PUB.pubsub.publish(PUB.CHAIN_UPDATED, { chainUpdated: chainState });
                });
            }
        }
        catch (e) {
            console.log("Error when updating Coin Data " + e);
        }
    },
    'chain.getCurrentValidatorSet': async function () {
        const validators = await kit.contracts.getValidators();
        const validatorSet = await validators.currentValidatorAccountsSet();
        return validatorSet;
    }
})