import Blockchain from '../../blockchain/index';
import Pool from '../../transaction/Pool';

const _blockchain = new Blockchain();

const _unspentTxOuts = new Map();

const _pool = new Pool();

export const blockchain = _blockchain;

export const unspentTxOuts = _unspentTxOuts;    

export const pool = _pool;