import { Mongo } from 'meteor/mongo';

const Proposals = new Mongo.Collection('proposals');

export default Proposals;
