import * as blockUtil from "../utils/blockUtils";
import { isValidChain } from '../utils/chainUtils';

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

export default Blockchain;