import { hash } from './commonUtils';
import Block from '../blockchain/block';

export const createGenesisBlock = () => {
    let block = new Block(0, "0", "0", Date.now(), []);
    block.hash = hashBlock(block);
    return block;
};

export const hashBlock = (block) => {
    return hash(`${block.index}${block.previousHash}${block.timeStamp}${block.data}`);
};