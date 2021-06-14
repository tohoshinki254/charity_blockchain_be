const Blockchain = require('../../blockchain/index');
const Pool = require('../../transaction/Pool');

const _blockchain = new Blockchain();

const _unspentTxOuts = new Map();

const _pool = new Pool();

const _event = new Map();

const _numUser = 0;

const _accountMap = new Map();

const accountMap = _accountMap;

const event = _event;

const numUser = _numUser;

const blockchain = _blockchain;

const unspentTxOuts = _unspentTxOuts;    

const pool = _pool;

module.exports = {
    accountMap,
    event,
    numUser,
    blockchain,
    unspentTxOuts,
    pool
};