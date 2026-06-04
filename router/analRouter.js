// router/analRouter.js (통계 및 분석 화면 길잡이)

// 1. Express 모듈 및 라우터 객체 가져오기
const express = require('express');
const router = express.Router(); // 사용자의 접속 경로를 안내해 줄 길잡이(라우터) 생성

// 2. 실제 통계 로직(데이터 처리)이 담긴 컨트롤러 파일 불러오기
const anal = require('../lib/anal');

// ==============================================================================
// 3. 경로(URL) 연결 (라우팅)
// 💡 주의: 메인 서버(main.js)에서 app.use('/anal', analRouter)라고 설정해 두었기 때문에,
// 이곳에 적는 주소들은 자동으로 카페고리 앞부분에 '/anal'이 붙게 됩니다.
// ==============================================================================

// [경로 1] GET 요청: 브라우저 주소창에 /anal/customer 로 접속했을 때
// 목적: lib/anal.js 파일 안에 만들어둔 customeranal 함수를 실행시켜서
// 사용자에게 '지역별 고객 분포' 파이 차트 화면을 렌더링해 줍니다.
router.get('/customer', anal.customeranal);

// [경로 2] GET 요청: 브라우저 주소창에 /anal (또는 /anal/) 로만 접속했을 때
// 목적: 사용자가 좌측 메뉴나 주소창에서 실수로 뒤에 '/customer'를 빼먹고 들어오더라도,
// 에러 페이지(Cannot GET /anal)를 띄우지 않고 자연스럽게 '/anal/customer' 화면으로 자동 이동(redirect) 시켜주는 안전장치입니다.
router.get('/', (req, res) => res.redirect('/anal/customer'));

// 4. 모듈 내보내기
// 💡 작성한 라우터 덩어리를 밖으로 내보내야 메인 서버 파일(main.js)에서 이것을 인식하고 연결할 수 있습니다.
module.exports = router;