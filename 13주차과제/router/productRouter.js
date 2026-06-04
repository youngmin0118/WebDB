// router/productRouter.js (또는 상품 관리 라우터 파일)

// 1. 필요한 외부 모듈 가져오기
const express = require('express');
const router = express.Router(); // 길잡이(라우터) 객체 생성
const product = require('../lib/product'); // 실제 로직을 처리할 컨트롤러 가져오기

// 💡 Multer 모듈: 텍스트가 아닌 '파일(이미지, 동영상 등)'을 
// 클라이언트(브라우저)로부터 서버로 업로드받기 위해 사용하는 필수 미들웨어입니다.
const multer = require('multer'); 

// 2. Multer (이미지 업로드) 환경 설정
// 클라이언트에서 보낸 파일을 어디에, 어떤 이름으로 저장할지 셋팅합니다.
const upload = multer({
    storage: multer.diskStorage({
        // destination: 파일이 저장될 물리적인 폴더 위치를 지정합니다.
        destination: function (req, file, cb) {
            cb(null, 'public/images'); 
        },
        // filename: 저장될 파일의 이름을 지정합니다.
        filename: function (req, file, cb) {
            // file.originalname을 쓰면 사용자가 올린 원본 파일명(예: shirt.png) 그대로 저장됩니다.
            cb(null, file.originalname); 
        }
    })
});

// ==============================================================================
// 3. 상품 관련 라우팅 (경로 연결)
// 메인 서버(main.js)에서 app.use('/product', ...)로 연결했다면, 아래 주소들은 앞에 '/product'가 붙습니다.
// ==============================================================================

// [경로 1] 전체 상품 목록 조회 화면
// 실제 주소: /product/view
router.get('/view', product.view);

// [경로 2] 카테고리별 상품 필터링 조회 화면
// 💡 사이드바에서 특정 대분류(mainId)와 소분류(subId) 메뉴를 클릭했을 때, 해당 카테고리의 상품만 보여줍니다.
// 예: /product/category/0001/0002
router.get('/category/:mainId/:subId', product.categoryView);

// [경로 3] 상품 등록 폼 화면
router.get('/create', product.create);

// [경로 4] 상품 등록 데이터 및 이미지 파일 처리 (POST)
// 💡 upload.single('uploadFile'): 폼 데이터 중에서 name이 'uploadFile'인 사진 파일 1개를 
// 먼저 가로채서 public 폴더에 쏙 저장한 뒤에, 그 다음 로직인 product.create_process 로 넘겨줍니다.
router.post('/create_process', upload.single('uploadFile'), product.create_process);

// [경로 5] 상품 수정 폼 화면
// 💡 어떤 상품을 수정할지 알아야 하므로 주소창 변수(':updateId')로 상품 번호를 전달받습니다.
router.get('/update/:updateId', product.update);

// [경로 6] 상품 수정 데이터 및 이미지 파일 처리 (POST)
// 수정할 때도 사진을 새로 바꿀 수 있으므로 똑같이 upload.single() 미들웨어를 거쳐갑니다.
router.post('/update_process', upload.single('uploadFile'), product.update_process);

// [경로 7] 특정 상품 삭제 처리
// 어떤 상품을 삭제할지 주소창 변수(':deleteId')로 전달받아 삭제를 수행합니다.
router.get('/delete/:deleteId', product.delete_process);

// 4. 모듈 내보내기 (이 라우터를 메인 서버가 쓸 수 있도록 허용)
module.exports = router;