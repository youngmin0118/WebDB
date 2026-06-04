// router/codeRouter.js (또는 카테고리 라우터 파일)

// 1. Express 모듈 및 라우터 객체 가져오기
const express = require('express');
const router = express.Router(); // 사용자의 접속 경로를 목적지로 안내해 줄 길잡이(라우터) 생성

// 2. 실제 데이터 처리 로직이 담긴 컨트롤러 파일 불러오기
// 라우터는 길 안내만 하고, 실제 화면을 그리거나 DB에 접근하는 일은 lib/code.js에게 맡깁니다.
var code = require('../lib/code');

// ==============================================================================
// 💡 알림: 메인 서버(main.js)에서 app.use('/code', codeRouter)라고 설정했을 것이므로,
// 이곳에 적는 모든 주소들은 자동으로 맨 앞에 '/code'가 기본으로 붙게 됩니다.
// ==============================================================================

/**
 * [경로 1] 코드(카테고리) 목록 조회 화면
 * 실제 주소: /code/view
 */
router.get('/view', (req, res) => { 
    code.view(req, res); // lib/code.js의 view 함수 실행
});

/**
 * [경로 2] 코드(카테고리) 생성 폼 화면
 * 실제 주소: /code/create
 */
router.get('/create', (req, res) => { 
    code.create(req, res); 
});

/**
 * [경로 3] 코드(카테고리) 생성 데이터 처리
 * 방식: POST (폼에서 전달된 데이터를 안전하게 DB에 저장)
 */
router.post('/create_process', (req, res) => { 
    code.create_process(req, res); 
});

/**
 * [경로 4] 코드(카테고리) 수정 폼 화면
 * 💡 핵심: code 테이블은 식별 키가 하나가 아니라 여러 개(main_id, sub_id, start, end)입니다.
 * 따라서 어떤 코드를 수정할지 알려주기 위해 주소창에 변수 4개를 이어서(:main/:sub/:start/:end) 전달받습니다.
 * 예: /code/update/0001/0002/1/10
 */
router.get('/update/:main/:sub/:start/:end', (req, res) => { 
    code.update(req, res); 
});

/**
 * [경로 5] 코드(카테고리) 수정 데이터 DB 반영
 * 방식: POST
 */
router.post('/update_process', (req, res) => { 
    code.update_process(req, res); 
});

/**
 * [경로 6] 특정 코드(카테고리) 삭제 처리
 * 수정할 때와 마찬가지로 삭제할 대상을 정확히 찾기 위해 4개의 변수를 모두 주소창으로 전달받습니다.
 */
router.get('/delete/:main/:sub/:start/:end', (req, res) => { 
    code.delete_process(req, res); 
});

// 3. 모듈 내보내기 (이 길잡이를 메인 서버가 쓸 수 있도록 허용)
module.exports = router;