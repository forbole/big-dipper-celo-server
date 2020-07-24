import { Meteor } from "meteor/meteor";
import { newKit, CeloContract } from "@celo/contractkit";

import { Contracts } from "../../contracts/contracts";
import { AccountsABI } from "../../contracts/ABIs/Accounts";
import { AttestationsABI } from "../../contracts/ABIs/Attestations";
import { LockedGoldABI } from "../../contracts/ABIs/LockedGold";
import { EscrowABI } from "../../contracts/ABIs/Escrow";
import { ExchangeABI } from "../../contracts/ABIs/Exchange";
import { FeeCurrencyWhitelistABI } from "../../contracts/ABIs/FeeCurrencyWhitelist";
import { GasPriceMinimumABI } from "../../contracts/ABIs/GasPriceMinimum";
import { GoldTokenABI } from "../../contracts/ABIs/GoldToken";
import { RandomABI } from "../../contracts/ABIs/Random";
import { ReserveABI } from "../../contracts/ABIs/Reserve";
import { SortedOraclesABI } from "../../contracts/ABIs/SortedOracles";
import { StableTokenABI } from "../../contracts/ABIs/StableToken";
import { ValidatorsABI } from "../../contracts/ABIs/Validators";

import * as abiDecoder from "abi-decoder";

let kit = newKit(Meteor.settings.public.fornoAddress);
let web3 = kit.web3;

Meteor.methods({
  "contract.getContractAddress": async function () {
    let contracts = {};

    contracts["Accounts"] = await kit.registry.addressFor(
      CeloContract.Accounts
    );
    contracts["Attestations"] = await kit.registry.addressFor(
      CeloContract.Attestations
    );
    contracts["LockedGold"] = await kit.registry.addressFor(
      CeloContract.LockedGold
    );
    contracts["Escrow"] = await kit.registry.addressFor(CeloContract.Escrow);
    contracts["Exchange"] = await kit.registry.addressFor(
      CeloContract.Exchange
    );
    contracts["FeeCurrencyWhitelist"] = await kit.registry.addressFor(
      CeloContract.FeeCurrencyWhitelist
    );
    contracts["GasPriceMinimum"] = await kit.registry.addressFor(
      CeloContract.GasPriceMinimum
    );
    contracts["GoldToken"] = await kit.registry.addressFor(
      CeloContract.GoldToken
    );
    contracts["Random"] = await kit.registry.addressFor(CeloContract.Random);
    contracts["Registry"] = await kit.registry.addressFor(
      CeloContract.Registry
    );
    contracts["Reserve"] = await kit.registry.addressFor(CeloContract.Reserve);
    contracts["SortedOracles"] = await kit.registry.addressFor(
      CeloContract.SortedOracles
    );
    contracts["StableToken"] = await kit.registry.addressFor(
      CeloContract.StableToken
    );
    contracts["Validators"] = await kit.registry.addressFor(
      CeloContract.Validators
    );

    let contractABI = {};
    contractABI["Accounts"] = AccountsABI

    contractABI["Attestations"] = AttestationsABI

    contractABI["LockedGold"] = LockedGoldABI

    contractABI["Escrow"] = EscrowABI

    contractABI["Exchange"] = ExchangeABI

    contractABI["FeeCurrencyWhitelist"] = FeeCurrencyWhitelistABI

    contractABI["GasPriceMinimum"] = GasPriceMinimumABI

    contractABI["GoldToken"] = GoldTokenABI

    contractABI["Random"] = RandomABI

    contractABI["Reserve"] = ReserveABI

    contractABI["SortedOracles"] = SortedOraclesABI

    contractABI["StableToken"] = StableTokenABI

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
                console.log(e);
              }
            });
          }
        );
      } catch (e) {
        console.log(e);
      }
    });


    console.log(contracts);
    return contracts;
  },
});
