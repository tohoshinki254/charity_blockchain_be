const { hash } = require('../utils/commonUtils');

class Transaction {
    constructor(senderAddress, txIns, txOuts, amount) {
        this.id = null;
        this.senderAddress = senderAddress;
        this.txIns = txIns;
        this.txOuts = txOuts;
        this.timestamp = Date.now();
        this.amount = amount;
    }

    hashData = () => {
        const txInContent = this.txIns
            .map((txIn) => txIn.txOutId + txIn.txOutIndex)
            .reduce((a, b) => a + b, '');
    
        const txOutContent = this.txOuts
            .map((txOut) => txOut.address + txOut.amount)
            .reduce((a, b) => a + b, '');

        this.id = hash(txInContent + txOutContent);
        return this.id;
    }
}   

module.exports = Transaction;