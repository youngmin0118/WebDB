const express = require('express');
const router = express.Router();
const root = require('../lib/root');
const multer = require('multer');


// 메인 홈 화면 
router.get('/', (req, res) => {
    root.home(req, res);
});

// 파일 업로드 설정
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/image');
        },
        filename: function (req, file, cb) {
            // 한글 파일명 깨짐 방지
            var newFileName = Buffer.from(file.originalname, "latin1").toString("utf-8");
            cb(null, newFileName);
        }
    }),
});

// 업로드 페이지 출력
router.get('/upload', (req, res) => {
    // lib/root.js에 upload 메소드를 만들어서 호출하거나 직접 작성
    // 여기서는 교재 흐름상 root 모듈에서 처리하도록 넘깁니다.
    root.upload(req, res);
});

// 업로드 프로세스 처리
router.post('/upload_process', upload.single('uploadFile'), (req, res) => {
    var file = '/images/' + req.file.filename;
    res.send(`
        <h1>Image Upload Successfully</h1>
        <a href="/">Back</a>
        <p><img src="${file}" alt="image 출력" style="width:300px;"/></p>
    `);
    console.log(file);
});

router.post('/search', root.search);
module.exports = router;