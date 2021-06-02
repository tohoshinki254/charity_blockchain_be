import * as blockUtil from "../utils/blockUtils";

class Blockchain {
    constructor() {
        this.chain = [blockUtil.createGenesisBlock()];
    }

    addBlock = (transactions) => {
        
    }

    verifyNewBlock = (newBlock) => {
        return this.chain[this.chain.length - 1].hash === newBlock.previousHash;
    }
}