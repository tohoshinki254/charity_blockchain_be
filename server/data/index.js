const Blockchain = require('../../blockchain/index');
const Pool = require('../../transaction/Pool');

const _blockchain = new Blockchain();

const _unspentTxOuts = new Map();

const _pool = new Pool();

const _event = new Map();

const _accountMap = new Map();

const _peerHttpPortList = [];

const _sockets = [];  

const _senderSockets = [];

const accountMap = _accountMap;

const event = _event;

const blockchain = _blockchain;

const unspentTxOuts = _unspentTxOuts;    

const pool = _pool;

const peerHttpPortList = _peerHttpPortList;

const sockets = _sockets;

const senderSockets = _senderSockets;

module.exports = {
    accountMap,
    event,
    blockchain,
    unspentTxOuts,
    pool,
    peerHttpPortList,
    sockets,
    senderSockets
};