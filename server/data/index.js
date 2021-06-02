import Pool from '../../transaction/Pool';

const _unspentTxOuts = new Map();

const _pool = new Pool();

export const unspentTxOuts = _unspentTxOuts;    

export const pool = _pool;