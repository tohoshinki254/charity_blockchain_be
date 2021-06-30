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

const getTotalDisbursement = (walletAddress, blockchain) => {
    let total = 0;
    console.log(walletAddress)

    for (let i = 0; i < blockchain.chain.length; i++) {
        for (let j = 0; j < blockchain.chain[i].data.length; j++) {
            let transaction = blockchain.chain[i].data[j]
            // for (let k = 0; k < transactions.length; k++) {

            if (transaction.senderAddress == null) {
                continue;
            }

            // let isSame = transaction.senderAddress.localeCompare(walletAddress);
            // if (isSame == 0) {

            let txOuts = transaction.txOuts;
            console.log("txouts.length", txOuts.length);
            if (txOuts.length == 2) {
                continue;
            }
            else if (txOuts.length == 1) {
                if (txOuts[0].address.localeCompare(transaction.senderAddress) == 0) {
                    total = total + transaction.amount;
                }
            }
            else {
                total = total + transaction.amount;
            }

            
            // }
            // }
        }
    }
    return total;
}

module.exports = { isValidChain, getTotalDisbursement };