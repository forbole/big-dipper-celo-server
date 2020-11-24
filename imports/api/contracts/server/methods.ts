import { Meteor } from "meteor/meteor";
import { newKit, CeloContract } from "@celo/contractkit";

import { ABI as AccountsABI } from "@celo/contractkit/lib/generated/Accounts";
import { ABI as AttestationsABI } from "@celo/contractkit/lib/generated/Attestations";
import { ABI as BlockchainParametersABI } from "@celo/contractkit/lib/generated/BlockchainParameters";
import { ABI as DoubleSigningSlasherABI } from "@celo/contractkit/lib/generated/DoubleSigningSlasher";
import { ABI as DowntimeSlasherABI } from "@celo/contractkit/lib/generated/DowntimeSlasher";
import { ABI as ElectionABI } from "@celo/contractkit/lib/generated/Election";
import { ABI as EpochRewardsABI } from "@celo/contractkit/lib/generated/EpochRewards";
import { ABI as EscrowABI } from "@celo/contractkit/lib/generated/Escrow";
import { ABI as ExchangeABI } from "@celo/contractkit/lib/generated/Exchange";
import { ABI as FeeCurrencyWhitelistABI } from "@celo/contractkit/lib/generated/FeeCurrencyWhitelist";
import { ABI as FreezerABI } from "@celo/contractkit/lib/generated/Freezer";
import { ABI as GasPriceMinimumABI } from "@celo/contractkit/lib/generated/GasPriceMinimum";
import { ABI as GoldTokenABI } from "@celo/contractkit/lib/generated/GoldToken";
import { ABI as GovernanceApproverMultiSigABI } from "@celo/contractkit/lib/generated/GovernanceApproverMultiSig";
import { ABI as GovernanceABI } from "@celo/contractkit/lib/generated/Governance";
import { ABI as LockedGoldABI } from "@celo/contractkit/lib/generated/LockedGold";
import { ABI as MultiSigABI } from "@celo/contractkit/lib/generated/MultiSig";
import { ABI as ProxyABI } from "@celo/contractkit/lib/generated/Proxy";
import { ABI as RandomABI } from "@celo/contractkit/lib/generated/Random";
import { ABI as RegistryABI } from "@celo/contractkit/lib/generated/Registry";
import { ABI as ReleaseGoldABI } from "@celo/contractkit/lib/generated/ReleaseGold";
import { ABI as ReserveABI } from "@celo/contractkit/lib/generated/Reserve";
import { ABI as ReserveSpenderMultiSigABI } from "@celo/contractkit/lib/generated/ReserveSpenderMultiSig";
import { ABI as SortedOraclesABI } from "@celo/contractkit/lib/generated/SortedOracles";
import { ABI as StableTokenABI } from "@celo/contractkit/lib/generated/StableToken";
import { ABI as TransferWhitelistABI } from "@celo/contractkit/lib/generated/TransferWhitelist";
import { ABI as ValidatorsABI } from "@celo/contractkit/lib/generated/Validators";


import { Contracts } from "../../contracts/contracts";

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
  "contract.getContractAddress": async function () {
    let contracts = {};
    try {
      contracts["Accounts"] = await kit.registry.addressFor(CeloContract.Accounts);
      contracts["Attestations"] = await kit.registry.addressFor(CeloContract.Attestations);
      contracts["BlockchainParameters"] = await kit.registry.addressFor(CeloContract.BlockchainParameters);
      contracts["DoubleSigningSlasher"] = await kit.registry.addressFor(CeloContract.DoubleSigningSlasher);
      contracts["DowntimeSlasher"] = await kit.registry.addressFor(CeloContract.DowntimeSlasher);
      contracts["Election"] = await kit.registry.addressFor(CeloContract.Election);
      contracts["EpochRewards"] = await kit.registry.addressFor(CeloContract.EpochRewards);
      contracts["Escrow"] = await kit.registry.addressFor(CeloContract.Escrow);
      contracts["Exchange"] = await kit.registry.addressFor(CeloContract.Exchange);
      contracts["FeeCurrencyWhitelist"] = await kit.registry.addressFor(CeloContract.FeeCurrencyWhitelist);
      contracts["Freezer"] = await kit.registry.addressFor(CeloContract.Freezer);
      contracts["GasPriceMinimum"] = await kit.registry.addressFor(CeloContract.GasPriceMinimum);
      contracts["GoldToken"] = await kit.registry.addressFor(CeloContract.GoldToken);
      contracts["Governance"] = await kit.registry.addressFor(CeloContract.Governance);
      contracts["LockedGold"] = await kit.registry.addressFor(CeloContract.LockedGold);
      contracts["Random"] = await kit.registry.addressFor(CeloContract.Random);
      contracts["Registry"] = await kit.registry.addressFor(CeloContract.Registry);
      contracts["Reserve"] = await kit.registry.addressFor(CeloContract.Reserve);
      contracts["SortedOracles"] = await kit.registry.addressFor(CeloContract.SortedOracles);
      contracts["StableToken"] = await kit.registry.addressFor(CeloContract.StableToken);
      contracts["TransferWhitelist"] = await kit.registry.addressFor(CeloContract.TransferWhitelist);
      contracts["Validators"] = await kit.registry.addressFor(CeloContract.Validators);

    }
    catch (error) {
      console.log("Error when getting Contract Address " + error)
    }

    let contractABI = {};
    contractABI["Accounts"] = AccountsABI
    contractABI["Attestations"] = AttestationsABI
    contractABI["BlockchainParameters"] = BlockchainParametersABI
    contractABI["DoubleSigningSlasher"] = DoubleSigningSlasherABI
    contractABI["DowntimeSlasher"] = DowntimeSlasherABI
    contractABI["Election"] = ElectionABI
    contractABI["EpochRewards"] = EpochRewardsABI
    contractABI["Escrow"] = EscrowABI
    contractABI["Exchange"] = ExchangeABI
    contractABI["FeeCurrencyWhitelist"] = FeeCurrencyWhitelistABI
    contractABI["Freezer"] = FreezerABI
    contractABI["GasPriceMinimum"] = GasPriceMinimumABI
    contractABI["GoldToken"] = GoldTokenABI
    contractABI["Governance"] = GovernanceABI
    contractABI["LockedGold"] = LockedGoldABI
    contractABI["Random"] = RandomABI
    contractABI["Registry"] = RegistryABI
    contractABI["Reserve"] = ReserveABI
    contractABI["SortedOracles"] = SortedOraclesABI
    contractABI["StableToken"] = StableTokenABI
    contractABI["TransferWhitelist"] = TransferWhitelistABI
    contractABI["Validators"] = ValidatorsABI

    Object.keys(contracts).forEach(function (item) {
      try {
        Contracts.upsert(
          { address: contracts[item] },
          {
            $set: {
              name: item,
              address: contracts[item],
            },
          },
          () => {
            Object.keys(contractABI).forEach(function (item) {
              try {
                Contracts.upsert(
                  { name: item },
                  {
                    $set: {
                      ABI: contractABI[item],
                    },
                  }
                );
              } catch (e) {
                console.log("Error when saving the ABIs " + e);
              }
            });
          }
        );
      } catch (e) {
        console.log("Error when saving Contract Address " + e);
      }
    });

    console.log(contracts);
    return contracts;
  },
});
