class TxOut {
    constructor(address, sender, receiver, amount) {
        this.address = address;
        this.amount = amount;
    }
}

module.exports = TxOut;