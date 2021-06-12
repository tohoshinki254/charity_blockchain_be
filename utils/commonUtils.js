import { SUCCESS_TRANSACTION, WAITING_CONFIRM } from "./constants";
import SHA256 from 'crypto-js/sha256';
import { v1 as uuidv1 } from 'uuid';
import { ec as EC } from 'elliptic';
import Transaction from "../transaction";

const ec = new EC("secp256k1");

export const hash = (data) => {
    return SHA256(data).toString();
};

export const generateId = () => {
    return uuidv1();
};

export const generateKeyPair = () => {
    return ec.genKeyPair();
};

export const getKeyPairFromPrivateKey = (privateKey) => {
    return ec.keyFromPrivate(privateKey, "hex");
};

export const verifyUnspentTxOut = (id, address, unspentTxOuts) => {
    if (unspentTxOuts.get(id)?.address === address) {
        return true;
    }
    return false;
};

export const verifySignature = (publicKey, signature, dataHash) => {
    return ec.keyFromPublic(publicKey, "hex").verify(dataHash, signature);
};

export const verifyTransaction = (publicKey, transaction) => {
    transaction.txIns.forEach((txIn) => {
        if (!verifySignature(publicKey, txIn.signature, transaction.hashData())) {
            return false;
        }
    });
};

export const convertTransactionFromChain = (chain) => {
    let result = [];

    chain.forEach((block) => {
        const transactions = block.data.map((tx) => ({
            senderAddress: tx.senderAddress,
            receiptAddress: tx.txOuts[0].address,
            amount: tx.txOuts[0].amount,
            timeStamp: tx.timeStamp,
            id: tx.hashData(),
            block: block.index,
            status: SUCCESS_TRANSACTION
        }));

        result = [...result, ...transactions];
    });

    return result;
};

export const convertTransactionInPool = (txsInPool) => {
    return txsInPool.map((tx) => ({
        senderAddress: tx.senderAddress,
        receiptAddress: tx.txOuts[0].address,
        amount: tx.txOuts[0].amount,
        timeStamp: tx.timeStamp,
        id: tx.hashData(),
        block: "N/A",
        status: WAITING_CONFIRM
    }));
};

export const getMyTransactions = (publicKey, chain) => {
    let results = [];
    chain.forEach(block => {
        const transactions = block.data
            .filter(tx => tx.senderAddress === publicKey)
            .map(tx => ({
                senderAddress: tx.senderAddress,
                receiverAddress: tx.txOuts[0].address,
                amount: tx.txOuts[0].amount,
                timeStamp: tx.timeStamp,
                id: tx.hashData(),
                block: block.index,
                status: SUCCESS_TRANSACTION
            }));

        results = [...results, ...transactions];
    });
    return results;
}