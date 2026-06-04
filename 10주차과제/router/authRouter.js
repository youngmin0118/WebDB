const express = require('express');
const router = express.Router();
const auth = require('../lib/auth'); // 우리가 만든 lib/auth.js 연결

// 로그인 화면 (/auth/login)
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

// 회원가입 화면 (/auth/register)
router.get('/register', (req, res) => {
    auth.register(req, res);
});

module.exports = router;