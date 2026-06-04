const express = require('express');
const router = express.Router();
const auth = require('../lib/auth'); // 이전에 만든 lib/auth.js 연결

// 로그인 화면 요청 (/auth/login)
router.get('/login', (req, res) => {
    auth.login(req, res);
});

// 로그인 처리 (/auth/login_process)
router.post('/login_process', (req, res) => {
    auth.login_process(req, res);
});

// 로그아웃 처리 (/auth/logout_process)
router.get('/logout_process', (req, res) => {
    auth.logout_process(req, res);
});

// 회원가입 화면 요청 (필요 시 추가)
router.get('/register', (req, res) => {
    // auth.register(req, res); 등을 호출
});

module.exports = router;