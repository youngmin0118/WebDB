// router/authRouter.js (로그인 및 인증 관련 라우터)

// 1. Express 모듈 및 라우터 객체 가져오기
const express = require('express');
const router = express.Router(); // 사용자의 접속 경로를 목적지로 안내해 줄 길잡이(라우터) 생성

// 2. 실제 인증 로직(데이터 처리)이 담긴 컨트롤러 파일 불러오기
// 라우터(Router)는 '길 안내' 역할만 하고, 실제 데이터베이스 조회나 화면 렌더링 같은 복잡한 작업은 lib 폴더의 auth.js에게 넘깁니다.
const auth = require('../lib/auth'); 

// ==============================================================================
// 3. 경로(URL) 연결 (라우팅)
// 💡 주의: 메인 서버(main.js)에서 app.use('/auth', authRouter)라고 설정해 두었을 것이므로,
// 이곳에 적는 주소들은 자동으로 맨 앞에 '/auth'가 기본으로 붙게 됩니다.
// ==============================================================================

/**
 * [경로 1] 로그인 폼 화면 띄우기
 * 방식: GET (주소창에 직접 입력하거나 일반 링크(a 태그)를 클릭해서 들어올 때 사용)
 * 실제 주소: /auth/login
 */
router.get('/login', (req, res) => {
    // 사용자가 로그인 화면을 요청하면, auth.js 안에 만들어둔 login 메소드를 실행합니다.
    auth.login(req, res);
});

/**
 * [경로 2] 로그인 폼 데이터 처리
 * 방식: POST (폼(form) 태그에서 아이디와 비밀번호 같은 민감한 데이터를 숨겨서 안전하게 전송할 때 사용)
 * 실제 주소: /auth/login_process
 */
router.post('/login_process', (req, res) => {
    // 폼에서 전송된 데이터를 받아 DB를 조회하고 세션(Session)을 발급하는 처리 로직을 실행합니다.
    auth.login_process(req, res);
});

/**
 * [경로 3] 로그아웃 처리
 * 방식: GET (로그아웃 버튼(링크)을 클릭했을 때 사용)
 * 실제 주소: /auth/logout_process
 */
router.get('/logout_process', (req, res) => {
    // 기존에 발급된 세션을 파괴하고 메인 홈으로 돌려보내는 로직을 실행합니다.
    auth.logout_process(req, res);
});

/**
 * [경로 4] 회원가입 폼 화면 띄우기
 * 방식: GET
 * 실제 주소: /auth/register
 */
router.get('/register', (req, res) => {
    // 비로그인 상태일 때 회원가입을 할 수 있는 폼(personCU.ejs) 화면을 렌더링하는 로직을 실행합니다.
    auth.register(req, res);
});

// 4. 모듈 내보내기
// 작성한 라우터(길잡이) 덩어리를 밖으로 내보내야 메인 서버 파일(main.js)에서 이것을 인식하고 연결할 수 있습니다.
module.exports = router;