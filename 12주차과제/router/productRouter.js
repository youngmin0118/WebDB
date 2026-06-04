const express = require('express');
const router = express.Router();
const product = require('../lib/product');
const multer = require('multer');

// 이미지 업로드 경로 및 파일명 설정
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images '); 
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname); 
        }
    })
});

// 상품 목록 및 기본 조회
router.get('/view', product.view);

// [추가] 카테고리별 필터링 조회 라우트
router.get('/category/:mainId/:subId', product.categoryView);

// 상품 등록
router.get('/create', product.create);
router.post('/create_process', upload.single('uploadFile'), product.create_process);

// 상품 수정
router.get('/update/:updateId', product.update);
router.post('/update_process', upload.single('uploadFile'), product.update_process);

// 상품 삭제
router.get('/delete/:deleteId', product.delete_process);

module.exports = router;