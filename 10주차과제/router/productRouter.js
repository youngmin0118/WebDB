const express = require('express');
const router = express.Router();
const product = require('../lib/product');

// 1. multer 모듈 불러오기 (이미지 업로드를 위해 필수)
const multer = require('multer');

// 2. 이미지가 저장될 위치와 파일명 설정
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            // 이미지가 저장될 폴더 경로입니다. (주의: public/images 폴더가 실제로 존재해야 합니다!)
            cb(null, 'public/images/'); 
        },
        filename: function (req, file, cb) {
            // 업로드한 이미지 파일의 원본 이름(예: note.png)을 그대로 사용합니다.
            cb(null, file.originalname); 
        }
    })
});

// ==========================================
// 3. 라우터 설정
// ==========================================

// [목록 및 입력 화면]
router.get('/view', product.view);
router.get('/create', product.create);

// [상품 등록 처리] 
// 폼에서 전송된 'uploadFile' 이미지를 처리한 후 create_process로 보냅니다.
router.post('/create_process', upload.single('uploadFile'), product.create_process);

// [상품 수정 화면 및 처리]
router.get('/update/:updateId', product.update);
router.post('/update_process', upload.single('uploadFile'), product.update_process);

// [상품 삭제 처리]

router.get('/delete/:deleteId', product.delete_process);

module.exports = router;