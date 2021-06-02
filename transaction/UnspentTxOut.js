class UnspentTxOut {
    constructor(txOutId, address, sender, receiver, amount) {
        this.txOutId = txOutId;
        this.address = address;
        this.amount = amount;
    }
}

export default UnspentTxOut;