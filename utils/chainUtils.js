const { event } = require('../server/data');
const { createGenesisBlock, hashBlock } = require('./blockUtils');

const isValidChain = (chain) => {
    if (chain && JSON.stringify(chain[0]) != JSON.stringify(createGenesisBlock())) {
        return false;
    }

    for (let i = 1; i < chain.length; i++) {
        const previousBlock = chain[i - 1];
        const currentBlock = chain[i];

        if (currentBlock.previousHash != previousBlock.hash || currentBlock.hash != hashBlock(currentBlock)) {
            return false;
        }
    }
    return true;
}

const getTotalDisbursement = (eventAddress, blockchain) => {
    let total = 0;

    if (event.get(eventAddress) === undefined) {
        throw new Error("This address is not an event");
    }

    for (let i = 0; i < blockchain.chain.length; i++) {
        for (let j = 0; j < blockchain.chain[i].data.length; j++) {
            let transaction = blockchain.chain[i].data[j]
            if (transaction.senderAddress != null && transaction.senderAddress.localeCompare(eventAddress) == 0) {
                total = total + transaction.amount;
            }
        }
    }
    return total;
}

module.exports = { isValidChain, getTotalDisbursement };