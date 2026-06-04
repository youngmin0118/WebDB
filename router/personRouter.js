// router/personRouter.js (회원 관리 길잡이 라우터)

// 1. Express 모듈 및 라우터 객체 가져오기
const express = require('express');
const router = express.Router(); // 사용자의 접속 경로를 목적지로 안내해 줄 길잡이(라우터) 생성

// 2. 실제 데이터 처리 로직이 담긴 컨트롤러 파일 불러오기
// 라우터는 단순히 길 안내만 하고, 실제 화면을 그리거나 DB를 조작하는 복잡한 일은 lib/person.js에게 넘깁니다.
const person = require('../lib/person');

// ==============================================================================
// 💡 알림: 메인 서버(main.js)에서 app.use('/person', personRouter)라고 설정했을 것이므로,
// 이곳에 적는 모든 주소들은 자동으로 맨 앞에 '/person'이 기본으로 붙게 됩니다.
// ==============================================================================

/**
 * [경로 1] 회원 목록 조회 화면
 * 방식: GET
 * 실제 주소: /person/view
 */
router.get('/view', (req, res) => person.view(req, res));

/**
 * [경로 2] 회원 생성(가입) 폼 화면
 * 방식: GET
 * 실제 주소: /person/create
 */
router.get('/create', (req, res) => person.create(req, res));

/**
 * [경로 3] 회원 생성 데이터 처리 (DB 저장)
 * 방식: POST (비밀번호 등 민감한 개인정보가 포함된 폼 데이터를 안전하게 전송)
 * 실제 주소: /person/create_process
 */
router.post('/create_process', (req, res) => person.create_process(req, res));

/**
 * [경로 4] 특정 회원 정보 수정 폼 화면
 * 방식: GET
 * 💡 핵심: 어떤 회원의 정보를 수정할지 알아야 하므로 주소창에 변수(':loginId')를 뚫어놓았습니다.
 * 예: /person/update/user1 이라고 접속하면, 'user1'이라는 값이 컨트롤러로 전달됩니다.
 */
router.get('/update/:loginId', (req, res) => person.update(req, res));

/**
 * [경로 5] 회원 정보 수정 데이터 DB 반영
 * 방식: POST
 * 실제 주소: /person/update_process
 */
router.post('/update_process', (req, res) => person.update_process(req, res));

/**
 * [경로 6] 특정 회원 삭제 처리
 * 방식: GET
 * 💡 핵심: 수정할 때와 마찬가지로, 삭제할 회원의 아이디를 주소창(':loginId')으로 전달받아 삭제를 수행합니다.
 * 예: /person/delete/user1
 */
router.get('/delete/:loginId', (req, res) => person.delete_process(req, res));

// 3. 모듈 내보내기 (이 길잡이를 메인 서버인 main.js가 쓸 수 있도록 허용)
module.exports = router;