const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const { authenticate } = require('../middlewares/authenticate');

router.get('/', (req, res, next) => {
  res.render('index', { title: 'Charity Block BE' });
});

// get blocks
router.get('/blocks', (req, res, next) => {
  controller.getBlocks(req, res, next);
});

// create-wallet
router.post('/wallet', (req, res, next) => {
  controller.createWallet(req, res, next);
});

// access wallet
// [headers] authorization: privateKey
router.post('/wallet-access', authenticate, (req, res, next) => {
  controller.accessWallet(req, res, next);
});

// get wallet information
// [headers] authorization: privateKey
router.post('/wallet', authenticate, (req, res, next) => {
  controller.getWalletInfo(req, res, next);
});

// create transaction
// [headers] authorization: privateKey
// [body] {
//    receiptAddress: address of receipt
//    amount: amount
// }
router.post('/transaction', authenticate, (req, res, next) => {
  controller.createTransaction(req, res, next);
});

// get transactions in pool
router.get('/transaction', (req, res, next) => {
  controller.getTransactionInPool(req, res, next);
});

// get history
router.get('/history', (req, res, next) => {
  controller.getHistory(req, res, next);
});

// get my transactions
// [query] address
router.get('/transaction/mine', (req, res, next) => {
  controller.getTransactionsByPrivateKey(req, res, next);
});

// get block by index
// [query] index
router.get('/blocks/:index', (req, res, next) => {
  controller.getBlockByIndex(req, res, next);
});

module.exports = router;
