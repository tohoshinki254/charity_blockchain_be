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

module.exports = { isValidChain };