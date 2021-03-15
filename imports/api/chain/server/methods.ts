import { Meteor } from 'meteor/meteor';
import { newKit } from '@celo/contractkit';
import fetch from 'cross-fetch';
import Chain from '../chain';
import Accounts from '../../accounts/accounts';

import PUB from '../../graphql/subscriptions';

const kit = newKit(Meteor.settings.public.fornoAddress);
const { web3 } = kit;

Meteor.methods({
  'chain.updateChain': async function (height) {
    this.unblock();

    let chainId; let validators; let epochSize; let epochNumber; let firstBlockNumberForEpoch; let lastBlockNumberForEpoch; let goldToken; let
      stableToken;

    try {
      chainId = await web3.eth.net.getId();
    } catch (e) {
      console.log(`Error when processing chainId ${e}`);
    }

    try {
      epochNumber = await kit.getEpochNumberOfBlock(height);
    } catch (e) {
      console.log(`Error when updating Epoch Number ${e}`);
    }

    try {
      validators = await kit.contracts.getValidators();
    } catch (e) {
      console.log(`Error when updating Validators Contract ${e}`);
    }

    try {
      epochSize = await validators.getEpochSize();
    } catch (e) {
      console.log(`Error when updating Epoch Size ${e}`);
    }
    try {
      firstBlockNumberForEpoch = await kit.getFirstBlockNumberForEpoch(epochNumber);
    } catch (e) {
      console.log(`Error when updating firstBlockNumberForEpoch ${e}`);
    }

    try {
      lastBlockNumberForEpoch = await kit.getLastBlockNumberForEpoch(epochNumber);
    } catch (e) {
      console.log(`Error when updating lastBlockNumberForEpoch ${e}`);
    }

    try {
      goldToken = await kit.contracts.getGoldToken();
    } catch (e) {
      console.log(`Error when processing Gold Token Contract ${e}`);
    }

    try {
      stableToken = await kit.contracts.getStableToken();
    } catch (e) {
      console.log(`Error when processing Stable Token Contract  ${e}`);
    }

    try {
      Chain.upsert({
        chainId,
      }, {
        $set: {
          walletCount: Accounts.find().count(),
          epochNumber,
          epochSize: epochSize.toNumber(),
          firstBlockNumberForEpoch,
          lastBlockNumberForEpoch,
          celoTotalSupply: (await goldToken.totalSupply()).toNumber(),
          cUSDTotalSupply: (await stableToken.totalSupply()).toNumber(),
        },
      }, (error: any, result: any) => {
        const chainState = Chain.findOne({
          chainId,
        });
        PUB.pubsub.publish(PUB.CHAIN_UPDATED, {
          chainUpdated: chainState,
        });
      });
      return height;
    } catch (e) {
      console.log(`Error when updating Chain Data${e.response}`);
    }
  },

  'chain.updateCoin': async function () {
    // this.unblock();
    let url;

    try {
      url = 'https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true';
    } catch (e) {
      console.log(`Error when updating the coin price ${e}`);
    }

    try {
      await fetch(url)
        .then((response) => {
          if (response.status >= 400) {
            console.log(`Bad response from server ${response}`);
          } else {
            response.json().then(async (data) => {
              let chainId: number;
              try {
                chainId = await web3.eth.net.getId();
              } catch (e) {
                console.log(`Error when processing chainId ${e}`);
              }
              Chain.upsert({
                chainId,
              }, {
                $set: {
                  tokenPrice: {
                    usd: data.celo?.usd,
                    usdMarketCap: data.celo?.usd_market_cap,
                    usd24hVol: data.celo?.usd_24h_vol,
                    usd24hChange: data.celo?.usd_24h_change,
                    lastUpdatedAt: data.celo?.last_updated_at,
                  },
                },
              }, (error: any, result: any) => {
                const chainState = Chain.findOne({
                  chainId,
                });
                PUB.pubsub.publish(PUB.CHAIN_UPDATED, {
                  chainUpdated: chainState,
                });
              });
            });
          }
        }).catch((e) => {
          console.log(`Error when getting Coin Data ${e}`);
        });
    } catch (e) {
      console.log(`Error when updating Coin Data ${e}`);
    }
  },

  'chain.getCurrentValidatorSet': async function () {
    let validators; let
      validatorSet;

    try {
      validators = await kit.contracts.getValidators();
    } catch (e) {
      console.log(`Error when getting Validators contract ${e}`);
    }
    try {
      validatorSet = await validators.currentValidatorAccountsSet();
    } catch (e) {
      console.log(`Error when getting current Validator Accounts Set ${e}`);
    }

    return validatorSet;
  },
});
