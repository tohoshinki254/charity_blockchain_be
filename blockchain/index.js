const blockUtil = require("../utils/blockUtils"); 
const { isValidChain } = require('../utils/chainUtils');

class Blockchain {
    constructor() {
        this.chain = [blockUtil.createGenesisBlock()];
    }

    addBlock = (transactions) => {
        const block = blockUtil.newBlock(this, transactions);

        if (!this.verifyNewBlock(block)) {
            throw Error('New block is invalid');
        }

        this.chain.push(block);
        return block;
    }

    replaceChain = (newChain) => {
        if (this.chain.length < newChain.length && isValidChain(newChain)) {
            this.chain = newChain;
            return true;
        }
        return false;
    }

    verifyNewBlock = (newBlock) => {
        return this.chain[this.chain.length - 1].hash === newBlock.previousHash;
    }
}

module.exports = Blockchain;