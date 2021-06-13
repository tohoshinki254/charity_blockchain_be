const { hash } = require('./commonUtils');
const Block = require('../blockchain/block');

const createGenesisBlock = () => {
    let block = new Block(0, "0", "0", Date.now(), []);
    block.hash = hashBlock(block);
    return block;
};

const hashBlock = (block) => {
    return hash(`${block.index}${block.previousHash}${block.timeStamp}${block.data}`);
};

const newBlock = (blockchain, data) => {
    const previousBlock = blockchain.chain[blockchain.chain.length - 1];
    const previousHash = previousBlock.hash;
    const index = previousBlock.index + 1;
    const timestamp = Date.now();

    let block = new Block(index, "0", previousHash, timestamp, data);
    block.hash = hashBlock(block);
    return block;
};

module.exports = {
    createGenesisBlock,
    hashBlock,
    newBlock
};