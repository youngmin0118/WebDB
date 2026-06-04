// lib/auth.js
var db = require('./db');
var sanitizeHtml = require('sanitize-html');

// 세션 정보를 확인하는 공용 함수
function authIsOwner(req, res) {
    var name = 'Guest';
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; 
    var cls = 'NON';
    
    if (req.session.is_logined) {
        name = req.session.name;
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls;
    }
    return { name, login, cls };
}

module.exports = {
    authIsOwner: authIsOwner,

    // 로그인 화면: 사이드바 데이터(code, boardtype)를 함께 조회하여 전달
    login: (req, res) => {
        const { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: 'Login',
                who: name,
                login: login,
                cls: cls,
                categoryList: results[0],
                boardtypes: results[1],
                body: 'login.ejs'         
            });
        });
    },

    login_process: (req, res) => {
        const post = req.body;
        const loginid = post.loginid.trim();
        const password = post.password.trim();

        if (loginid === 'admin' && password === '1234') {
            req.session.is_logined = true;
            req.session.loginid = 'admin';
            req.session.name = '과제용관리자';
            req.session.cls = 'MNG'; 
            return req.session.save(() => res.redirect('/'));
        } 
        else if (loginid === 'manager' && password === '1234') {
            req.session.is_logined = true;
            req.session.loginid = 'manager';
            req.session.name = '과제용경영진';
            req.session.cls = 'CEO';
            return req.session.save(() => res.redirect('/'));
        }
        else if (loginid === 'user1' && password === '1234') {
            req.session.is_logined = true;
            req.session.loginid = 'user1';
            req.session.name = '고객1';
            req.session.cls = 'CST';
            return req.session.save(() => res.redirect('/'));
        }
        else {
            db.query('SELECT name, class, loginid FROM person WHERE loginid = ? AND password = ?',
                [loginid, password], (error, results) => {
                    if (error) throw error;
                    if (results.length > 0) {
                        req.session.is_logined = true;
                        req.session.loginid = results[0].loginid;
                        req.session.name = results[0].name;
                        req.session.cls = results[0].class; 
                        req.session.save(() => res.redirect('/'));
                    } else {
                        res.send('<script>alert("아이디 또는 비밀번호 오류"); location.href="/auth/login";</script>');
                    }
                }
            );
        }
    },

    logout_process: (req, res) => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    },

    // [수정] 로그인 상태에 따른 조건부 리다이렉션
    register: (req, res) => {
        // 1. 이미 로그인한 사용자가 접근하면 홈으로 리다이렉트 (안전 장치)
        if (req.session.is_logined) {
            return res.redirect('/');
        }

        const { name, login, cls } = authIsOwner(req, res);
        // 2. 비로그인 사용자에게만 회원가입 페이지 출력 (사이드바 데이터 포함)
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '회원가입',
                who: name,
                login: login,
                cls: cls,
                categoryList: results[0],
                boardtypes: results[1],
                body: 'personCU.ejs'
            });
        });
    }
};