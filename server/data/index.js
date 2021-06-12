import Blockchain from '../../blockchain/index';
import Pool from '../../transaction/Pool';

const _blockchain = new Blockchain();

const _unspentTxOuts = new Map();

const _pool = new Pool();

const _event = [];

const _numUser = 0;

const _accountMap = new Map();

export const accountMap = _accountMap;

export const event = _event;

export const numUser = _numUser;

export const blockchain = _blockchain;

export const unspentTxOuts = _unspentTxOuts;    

export const pool = _pool;