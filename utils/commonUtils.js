import SHA256 from 'crypto-js/sha256';
import { v1 as uuidv1 } from 'uuid';
import { ec as EC } from 'elliptic';

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