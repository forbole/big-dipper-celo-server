const { PubSub } = require('apollo-server');
const pubsub = new PubSub();

export default { 
    pubsub: pubsub,
    BLOCK_ADDED: 'BLOCK_ADDED',
    TRANSACTION_ADDED: 'TRANSACTION_ADDED',
    ACCOUNT_ADDED: 'ACCOUNT_ADDED',
    CHAIN_UPDATED: 'CHAIN_UPDATED'
}
