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
// [body] name: name of creator
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
router.get('/wallet', authenticate, (req, res, next) => {
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
// [headers] authorization: privateKey
router.get('/transaction/mine', authenticate, (req, res, next) => {
  controller.getTransactionsByPrivateKey(req, res, next);
});

// get block by index
// [query] index
router.get('/blocks/:index', (req, res, next) => {
  controller.getBlockByIndex(req, res, next);
});

// create event
// [headers] authorization: privateKey of creator
// [body] {
//    name: nameEvent,
//    description: desc of event
//    startDate,
//    endDate
// }
router.post('/event', authenticate, (req, res, next) => {
  controller.createEvent(req, res, next);
});

// get events by private key of creator
// [headers] authorization: privateKey of creator
router.get('/event/mine', authenticate, (req, res, next) => {
  controller.getEventsByPrivateKey(req, res, next);
});

// get all events
router.get('/event', (req, res, next) => {
  controller.getAllEvents(req, res, next);
});

/**
 * Accept an event
 * [headers] authorization: privateKey of creator
 */
router.post('/event/accept', authenticate, (req, res, next) => {
  controller.acceptProject(req, res, next);
});



module.exports = router;
