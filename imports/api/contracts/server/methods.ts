import { Meteor } from 'meteor/meteor';
import {
  newKit, CeloContract,
} from '@celo/contractkit';

import { ABI as AccountsABI } from '@celo/contractkit/lib/generated/Accounts';
import { ABI as AttestationsABI } from '@celo/contractkit/lib/generated/Attestations';
import { ABI as BlockchainParametersABI } from '@celo/contractkit/lib/generated/BlockchainParameters';
import { ABI as DoubleSigningSlasherABI } from '@celo/contractkit/lib/generated/DoubleSigningSlasher';
import { ABI as DowntimeSlasherABI } from '@celo/contractkit/lib/generated/DowntimeSlasher';
import { ABI as ElectionABI } from '@celo/contractkit/lib/generated/Election';
import { ABI as EpochRewardsABI } from '@celo/contractkit/lib/generated/EpochRewards';
import { ABI as EscrowABI } from '@celo/contractkit/lib/generated/Escrow';
import { ABI as ExchangeABI } from '@celo/contractkit/lib/generated/Exchange';
import { ABI as FeeCurrencyWhitelistABI } from '@celo/contractkit/lib/generated/FeeCurrencyWhitelist';
import { ABI as FreezerABI } from '@celo/contractkit/lib/generated/Freezer';
import { ABI as GasPriceMinimumABI } from '@celo/contractkit/lib/generated/GasPriceMinimum';
import { ABI as GoldTokenABI } from '@celo/contractkit/lib/generated/GoldToken';
import { ABI as GovernanceABI } from '@celo/contractkit/lib/generated/Governance';
import { ABI as LockedGoldABI } from '@celo/contractkit/lib/generated/LockedGold';
import { ABI as RandomABI } from '@celo/contractkit/lib/generated/Random';
import { ABI as RegistryABI } from '@celo/contractkit/lib/generated/Registry';
import { ABI as ReserveABI } from '@celo/contractkit/lib/generated/Reserve';
import { ABI as SortedOraclesABI } from '@celo/contractkit/lib/generated/SortedOracles';
import { ABI as StableTokenABI } from '@celo/contractkit/lib/generated/StableToken';
import { ABI as TransferWhitelistABI } from '@celo/contractkit/lib/generated/TransferWhitelist';
import { ABI as ValidatorsABI } from '@celo/contractkit/lib/generated/Validators';
import Contracts from '../contracts';

const kit = newKit(Meteor.settings.public.fornoAddress);
const { web3 } = kit;

Meteor.methods({
  'contract.getContractAddress': async function () {
    const contracts: {[k: string] : any} = {
    };
    const contractABI: { [index: string]: any } = {
    };

    // Save contracts address

    // Accounts
    try {
      contracts.Accounts = await kit.registry.addressFor(CeloContract.Accounts);
    } catch (error) {
      console.log(`Error when getting Accounts Contract Address ${error}`);
    }

    // Attestations
    try {
      contracts.Attestations = await kit.registry.addressFor(CeloContract.Attestations);
    } catch (error) {
      console.log(`Error when getting Attestations Contract Address ${error}`);
    }

    // BlockchainParameters
    try {
      contracts.BlockchainParameters = await kit.registry.addressFor(CeloContract.BlockchainParameters);
    } catch (error) {
      console.log(`Error when getting Blockchain Parameters Contract Address ${error}`);
    }

    // DoubleSigningSlasher
    try {
      contracts.DoubleSigningSlasher = await kit.registry.addressFor(CeloContract.DoubleSigningSlasher);
    } catch (error) {
      console.log(`Error when getting Double Signing Slasher Contract Address ${error}`);
    }

    // DowntimeSlasher
    try {
      contracts.DowntimeSlasher = await kit.registry.addressFor(CeloContract.DowntimeSlasher);
    } catch (error) {
      console.log(`Error when getting Downtime Slasher Contract Address ${error}`);
    }

    // Election
    try {
      contracts.Election = await kit.registry.addressFor(CeloContract.Election);
    } catch (error) {
      console.log(`Error when getting Election Contract Address ${error}`);
    }

    // EpochRewards
    try {
      contracts.EpochRewards = await kit.registry.addressFor(CeloContract.EpochRewards);
    } catch (error) {
      console.log(`Error when getting EpochRewards Contract Address ${error}`);
    }

    // Escrow
    try {
      contracts.Escrow = await kit.registry.addressFor(CeloContract.Escrow);
    } catch (error) {
      console.log(`Error when getting Escrow Contract Address ${error}`);
    }

    // Exchange
    try {
      contracts.Exchange = await kit.registry.addressFor(CeloContract.Exchange);
    } catch (error) {
      console.log(`Error when getting Exchange Contract Address ${error}`);
    }

    // FeeCurrencyWhitelist
    try {
      contracts.FeeCurrencyWhitelist = await kit.registry.addressFor(CeloContract.FeeCurrencyWhitelist);
    } catch (error) {
      console.log(`Error when getting Fee Currency Whitelist Contract Address ${error}`);
    }

    // Freezer
    try {
      contracts.Freezer = await kit.registry.addressFor(CeloContract.Freezer);
    } catch (error) {
      console.log(`Error when getting Freezer Contract Address ${error}`);
    }

    // GasPriceMinimum
    try {
      contracts.GasPriceMinimum = await kit.registry.addressFor(CeloContract.GasPriceMinimum);
    } catch (error) {
      console.log(`Error when getting Gas Price Minimum Contract Address ${error}`);
    }

    // GoldToken
    try {
      contracts.GoldToken = await kit.registry.addressFor(CeloContract.GoldToken);
    } catch (error) {
      console.log(`Error when getting Gold Token Contract Address ${error}`);
    }

    // Governance
    try {
      contracts.Governance = await kit.registry.addressFor(CeloContract.Governance);
    } catch (error) {
      console.log(`Error when getting Governance Contract Address ${error}`);
    }

    // LockedGold
    try {
      contracts.LockedGold = await kit.registry.addressFor(CeloContract.LockedGold);
    } catch (error) {
      console.log(`Error when getting Locked Gold Contract Address ${error}`);
    }

    // Random
    try {
      contracts.Random = await kit.registry.addressFor(CeloContract.Random);
    } catch (error) {
      console.log(`Error when getting Random Contract Address ${error}`);
    }

    // Registry
    try {
      contracts.Registry = await kit.registry.addressFor(CeloContract.Registry);
    } catch (error) {
      console.log(`Error when getting Registry Contract Address ${error}`);
    }

    // Reserve
    try {
      contracts.Reserve = await kit.registry.addressFor(CeloContract.Reserve);
    } catch (error) {
      console.log(`Error when getting Reserve Contract Address ${error}`);
    }

    // SortedOracles
    try {
      contracts.SortedOracles = await kit.registry.addressFor(CeloContract.SortedOracles);
    } catch (error) {
      console.log(`Error when getting Sorted Oracles Contract Address ${error}`);
    }

    // StableToken
    try {
      contracts.StableToken = await kit.registry.addressFor(CeloContract.StableToken);
    } catch (error) {
      console.log(`Error when getting Stable Token Contract Address ${error}`);
    }

    // TransferWhitelist
    try {
      contracts.TransferWhitelist = await kit.registry.addressFor(CeloContract.TransferWhitelist);
    } catch (error) {
      console.log(`Error when getting Transfer Whitelist Contract Address ${error}`);
    }

    // Validators
    try {
      contracts.Validators = await kit.registry.addressFor(CeloContract.Validators);
    } catch (error) {
      console.log(`Error when getting Validators Contract Address ${error}`);
    }

    // Save contracts ABI
    contractABI.Accounts = AccountsABI;
    contractABI.Attestations = AttestationsABI;
    contractABI.BlockchainParameters = BlockchainParametersABI;
    contractABI.DoubleSigningSlasher = DoubleSigningSlasherABI;
    contractABI.DowntimeSlasher = DowntimeSlasherABI;
    contractABI.Election = ElectionABI;
    contractABI.EpochRewards = EpochRewardsABI;
    contractABI.Escrow = EscrowABI;
    contractABI.Exchange = ExchangeABI;
    contractABI.FeeCurrencyWhitelist = FeeCurrencyWhitelistABI;
    contractABI.Freezer = FreezerABI;
    contractABI.GasPriceMinimum = GasPriceMinimumABI;
    contractABI.GoldToken = GoldTokenABI;
    contractABI.Governance = GovernanceABI;
    contractABI.LockedGold = LockedGoldABI;
    contractABI.Random = RandomABI;
    contractABI.Registry = RegistryABI;
    contractABI.Reserve = ReserveABI;
    contractABI.SortedOracles = SortedOraclesABI;
    contractABI.StableToken = StableTokenABI;
    contractABI.TransferWhitelist = TransferWhitelistABI;
    contractABI.Validators = ValidatorsABI;

    Object.keys(contracts).forEach((item) => {
      try {
        Contracts.upsert(
          {
            address: contracts[item],
          },
          {
            $set: {
              name: item,
              address: contracts[item],
            },
          },
          () => {
            Object.keys(contractABI).forEach((element) => {
              try {
                Contracts.upsert(
                  {
                    name: element,
                  },
                  {
                    $set: {
                      ABI: contractABI[element],
                    },
                  },
                );
              } catch (e) {
                console.log(`Error when saving the ABIs ${e}`);
              }
            });
          },
        );
      } catch (e) {
        console.log(`Error when saving Contract Address ${e}`);
      }
    });

    console.log(contracts);
    return contracts;
  },
});
