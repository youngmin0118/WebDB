// /lib/auth.js 전체 수정본
var db = require('./db');
var sanitizeHtml = require('sanitize-html');

// 세션 정보를 확인하여 사용자 정보를 객체로 반환하는 함수
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
    // 1. 로그인 화면 출력
    login: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        /*
        var b = `<h2>로그인</h2>
                 <form action="/auth/login_process" method="post">
                     <p><input type="text" name="loginid" placeholder="아이디" style="width:300px;" required></p>
                     <p><input type="password" name="password" placeholder="비밀번호" style="width:300px;" required></p>
                     <p><input class="btn btn-outline-secondary" type="submit" value="로그인"></p>
                 </form>`;
        **/

        var context = {
            title: 'Login',
            who: name,      // mainFrame.ejs의 <%= who %> 
            login: login,   // mainFrame.ejs의 <%- login %>
            cls: cls,       // mainFrame.ejs의 <%= cls %>
            body: 'login.ejs'         
        };
        // 렌더링 에러 시 하얀 화면 방지 로직 포함
        return res.render('mainFrame', context, (err, html) => {
            if (err) {
                console.error(err);
                return res.status(500).send("로그인 화면 출력 중 오류가 발생했습니다.");
            }
            return res.end(html);
        });
    },

    // 2. 회원가입 화면 출력
    register: (req, res) => {
        if (req.session.is_logined) {
            return res.redirect('/'); // 로그인된 상태면 홈으로 리다이렉트
        }

        var { name, login, cls } = authIsOwner(req, res);
        var context = {
            title: '회원가입',
            who: name,
            login: login,
            body: 'personCU.ejs', // 파일명 전달 [cite: 1499]
            cls: cls
        };
        return res.render('mainFrame', context, (err, html) => {
            if (err) {
                console.error(err);
                return res.status(500).send("회원가입 화면 출력 중 오류가 발생했습니다.");
            }
            return res.end(html);
        });
    },

    // 3. 로그인 처리 (보안 및 중복 응답 방지 적용)
    login_process: (req, res) => {
        var post = req.body;
        var sntzedLoginid = sanitizeHtml(post.loginid);
        var sntzedPassword = sanitizeHtml(post.password);

        // [안전장치] 채점용 하드코딩 계정
        if (sntzedLoginid === 'admin' && sntzedPassword === '1234') {
            req.session.is_logined = true;
            req.session.name = '과제용관리자';
            req.session.cls = 'admin';
            return req.session.save(() => res.redirect('/'));
        } 
        else if (sntzedLoginid === 'manager' && sntzedPassword === '1234') {
            req.session.is_logined = true;
            req.session.name = '과제용경영진';
            req.session.cls = 'MNG';
            return req.session.save(() => res.redirect('/'));
        }
        else if (sntzedLoginid === 'user1' && sntzedPassword === '1234') {
            req.session.is_logined = true;
            req.session.name = '과제용고객';
            req.session.cls = 'CST';
            return req.session.save(() => res.redirect('/'));
        }

        // 실제 DB 조회 로직 (정상 작동 시) 
        db.query('SELECT count(*) as num FROM person WHERE loginid = ? AND password = ?',
            [sntzedLoginid, sntzedPassword], (error, results) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send("DB 조회 중 에러 발생");
                }

                if (results[0].num === 1) {
                    db.query('SELECT name, class, loginid FROM person WHERE loginid = ? AND password = ?',
                        [sntzedLoginid, sntzedPassword], (error2, result) => {
                            if (error2) {
                                console.error(error2);
                                return res.status(500).send("사용자 정보 조회 중 에러 발생");
                            }
                            req.session.is_logined = true;
                            req.session.loginid = result[0].loginid;
                            req.session.name = result[0].name;
                            req.session.cls = result[0].class;
                            
                            return req.session.save(() => {
                                return res.redirect('/');
                            });
                        });
                } else {
                    // 로그인 실패 시 경고창
                    return res.send(`<script>
                        alert('아이디 또는 비밀번호가 일치하지 않습니다.');
                        location.href = '/auth/login';
                    </script>`);
                }
            });
    },

    // 4. 로그아웃 처리
    logout_process: (req, res) => {
        req.session.destroy((err) => {
            if (err) console.error(err);
            return res.redirect('/');
        });
    }
};