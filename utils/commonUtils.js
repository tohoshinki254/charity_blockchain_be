const { SUCCESS_TRANSACTION, WAITING_CONFIRM } = require("./constants");
const SHA256 = require('crypto-js/sha256');
const uuidv1 = require('uuid').v1;
const EC = require('elliptic').ec;

const ec = new EC("secp256k1");

const hash = (data) => {
    return SHA256(data).toString();
};

const generateId = () => {
    return uuidv1();
};

const generateKeyPair = () => {
    return ec.genKeyPair();
};

const getKeyPairFromPrivateKey = (privateKey) => {
    return ec.keyFromPrivate(privateKey, "hex");
};

const verifyUnspentTxOut = (id, address, unspentTxOuts) => {
    if (unspentTxOuts.get(id).address === address) {
        return true;
    }
    return false;
};

const verifySignature = (publicKey, signature, dataHash) => {
    return ec.keyFromPublic(publicKey, "hex").verify(dataHash, signature);
};

const verifyTransaction = (publicKey, transaction) => {
    transaction.txIns.forEach((txIn) => {
        if (!verifySignature(publicKey, txIn.signature, transaction.id)) {
            return false;
        }
    });
};

const convertTransactionFromChain = (chain, event) => {
    let result = [];

    chain.forEach((block) => {
        const transactions = block.data.map((tx) => ({
            senderAddress: tx.senderAddress,
            receiptAddress: tx.txOuts[0].address,
            amount: tx.txOuts[0].amount,
            timeStamp: tx.timeStamp,
            id: tx.id,
            block: block.index,
            status: SUCCESS_TRANSACTION,
            nameEvent: event.get(tx.txOuts[0].address).name,
        }));

        result = [...result, ...transactions];
    });

    return result;
};

const convertTransactionInPool = (txsInPool, event) => {
    return txsInPool.map((tx) => ({
        senderAddress: tx.senderAddress,
        receiptAddress: tx.txOuts[0].address,
        amount: tx.txOuts[0].amount,
        timeStamp: tx.timeStamp,
        id: tx.id,
        block: "N/A",
        status: WAITING_CONFIRM,
        nameEvent: event.get(tx.txOuts[0].address).name,
    }));
};

const getMyTransactions = (publicKey, chain, event) => {
    let results = [];
    chain.forEach(block => {
        const transactions = block.data
            .filter(tx => tx.senderAddress === publicKey)
            .map(tx => ({
                senderAddress: tx.senderAddress,
                receiverAddress: tx.txOuts[0].address,
                amount: tx.txOuts[0].amount,
                timeStamp: tx.timeStamp,
                id: tx.id,
                block: block.index,
                status: SUCCESS_TRANSACTION,
                nameEvent: event.get(tx.txOuts[0].address).name
            }));

        results = [...results, ...transactions];
    });
    return results;
}

module.exports = {
    hash,
    generateId,
    generateKeyPair,
    getKeyPairFromPrivateKey,
    verifyUnspentTxOut,
    verifySignature,
    verifyTransaction,
    convertTransactionFromChain,
    convertTransactionInPool,
    getMyTransactions,
};