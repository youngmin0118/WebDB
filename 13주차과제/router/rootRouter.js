// router/rootRouter.js (또는 메인 라우터 파일)

// 1. 필요한 외부 모듈 가져오기
const express = require('express');
const router = express.Router(); // 접속 경로를 목적지로 안내해 줄 길잡이(라우터) 생성
const root = require('../lib/root'); // 메인 홈, 검색 등의 실제 로직이 담긴 파일
const multer = require('multer'); // 💡 텍스트가 아닌 파일(이미지 등) 업로드를 처리하기 위한 필수 패키지

// [추가] 분리한 tableManageRouter 모듈 가져오기
// 모든 경로를 한 파일에 적으면 너무 길어지므로, 관리자용 테이블 관리 라우터를 별도로 분리해서 불러옵니다.
const tableManageRouter = require('./tableManageRouter');


// ==========================================
// 🏠 [1] 메인 홈 화면 연결
// ==========================================
// 실제 주소: / (도메인 처음 접속 시 가장 먼저 실행되는 곳)
router.get('/', (req, res) => {
    root.home(req, res); // lib/root.js의 home 함수를 실행하여 메인 화면(전체 상품 목록 등)을 띄움
});


// ==========================================
// 📂 [2] 파일 업로드 (Multer) 환경 설정
// ==========================================
const upload = multer({
    storage: multer.diskStorage({
        // destination: 업로드된 파일이 실제 저장될 서버 컴퓨터 내의 물리적인 폴더 경로를 지정
        destination: function (req, file, cb) {
            cb(null, 'public/image'); // public 폴더 안의 image 폴더에 저장하겠다는 뜻
        },
        // filename: 폴더에 저장될 때 파일의 이름을 어떻게 정할지 설정
        filename: function (req, file, cb) {
            // 💡 핵심: 최신 Node.js 환경에서 한글 파일명이 '????.jpg'처럼 깨지는 현상을 방지하기 위한 인코딩 변환 작업
            // 기본 라틴(latin1) 언어셋으로 들어온 글자를 우리가 읽을 수 있는 유니코드(utf-8)로 바꿔줍니다.
            var newFileName = Buffer.from(file.originalname, "latin1").toString("utf-8");
            cb(null, newFileName); // 변환된 깔끔한 한글 이름으로 파일 저장
        }
    }),
});


// ==========================================
// 🖼️ [3] 파일 업로드 화면 및 프로세스 처리
// ==========================================

// [업로드 페이지 출력]
// 실제 주소: /upload (업로드 폼 화면을 띄워줌)
router.get('/upload', (req, res) => {
    // lib/root.js에 작성된 upload 메소드를 호출하여 화면(EJS)을 렌더링
    // 여기서는 교재 흐름상 root 모듈에서 처리하도록 넘깁니다.
    root.upload(req, res);
});

// [업로드 프로세스 처리]
// 💡 upload.single('uploadFile'): 폼에서 넘어온 데이터 중 <input type="file" name="uploadFile">에 담긴
// '단 1개의 파일'을 가로채서 위에서 설정한 규칙대로 지정된 폴더에 먼저 저장시킵니다.
router.post('/upload_process', upload.single('uploadFile'), (req, res) => {
    
    // 저장이 완료된 파일의 경로를 변수에 담습니다.
    var file = '/images/' + req.file.filename; 
    
    // 💡 화면 렌더링(ejs) 대신, 성공했다는 메시지와 함께 방금 올린 이미지를 즉석에서 HTML로 만들어 띄워줍니다.
    res.send(`
        <h1>Image Upload Successfully</h1>
        <a href="/">Back</a>
        <p><img src="${file}" alt="image 출력" style="width:300px;"/></p>
    `);
    console.log(file); // 테스트를 위해 서버 콘솔(터미널) 창에도 저장된 파일 경로를 출력해 봅니다.
});


// ==========================================
// 🔍 [4] 메인 상품 검색 라우터
// ==========================================
// 사용자가 좌측 상단 검색창에 단어를 입력하고 엔터를 치면 POST 방식으로 데이터를 넘깁니다.
router.post('/search', root.search);


// ====================================================================
// 🛠️ [5] 테이블 관리 전용 라우터 병합 (미들웨어)
// ====================================================================
// 💡 router.use() 활용:
// 사용자가 'localhost:3000/table' 로 시작하는 주소로 접속하면, 
// 여기서 직접 GET/POST를 처리하지 않고, 상단에서 불러온 'tableManageRouter'에게 길 안내 역할을 통째로 위임합니다.
// 즉, /table/view, /table/update 등의 처리를 tableManageRouter.js 파일에서 전담하게 됩니다.
router.use('/table', tableManageRouter);


// 완성된 메인 길잡이(라우터) 모듈을 내보내기 (메인 서버인 main.js가 사용할 수 있게 함)
module.exports = router;