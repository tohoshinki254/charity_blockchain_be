const { blockchain } = require('../server/data');
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

const getTotalDisbursement = (eventAddress) => {
    let total = 0;

    for (let i = 0; i < blockchain.chain.length; i++) {
        for (let j = 0; j < blockchain.chain[i].data.length; j++) {
            let transactions = blockchain.chain[i].data[j]
            for (let k = 0; k < transactions.length; k++) {
                let isSame = transactions[k].senderAddress.localeCompare(eventAddress);
                if (isSame == 0) {
                    total = total + transactions[k].amount;
                }
            }
        }
    }
    return total;
}

module.exports = { isValidChain, getTotalDisbursement };