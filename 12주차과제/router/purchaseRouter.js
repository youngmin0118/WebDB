const express = require('express');
const router = express.Router();
const purchase = require('../lib/purchase');

// 고객(CST) 서비스 엔드포인트
router.get('/detail/:prodId', purchase.purchasedetail);
router.post('/cart_process', purchase.cart_process);
router.post('/pay_process', purchase.pay_process);
router.get('/cart', purchase.cart);
router.post('/cart_to_purchase_process', purchase.cart_to_purchase_process);
router.post('/cartdelete_process', purchase.cartdelete_process);
router.get('/', purchase.purchase);
router.get('/cancel/:purchaseId', purchase.cancel_process);
router.post('/pay_process', purchase.pay_process);
// 관리자(Admin) 서비스 엔드포인트
router.get('/purchaseupdate/:purchaseId', purchase.purchaseupdate);
router.post('/purchaseupdate_process', purchase.purchaseupdate_process);


module.exports = router;