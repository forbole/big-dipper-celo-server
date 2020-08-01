import { Mongo } from 'meteor/mongo';
export const Validators = new Mongo.Collection('validators');
export const ValidatorRecords = new Mongo.Collection('validators_records');