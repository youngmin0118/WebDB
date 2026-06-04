// /lib/topic.js 전체 코드
const db = require('./db');
var sanitizeHtml = require('sanitize-html');
var path = require('path');

// [교재 p.32 & code.js 규격 반영] 세션 정보를 객체로 반환하는 함수 
function authIsOwner(req, res) {
    var name = 'Guest';
    // mainFrame.ejs에서 <%- login %>으로 출력하므로 HTML 태그를 문자열로 만듭니다
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; 
    var cls = 'NON';
    
    if (req.session.is_logined) {
        name = req.session.name || req.session.nickname; // 세션에 저장된 이름 또는 닉네임 사용
        // 로그인 상태일 때는 로그아웃 아이콘으로 변경 [cite: 825, 896]
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls || req.session.role; // 세션에 저장된 권한 사용
    }
    return { name, login, cls };
}

module.exports = {
    // 1. 홈 화면 처리
    home: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res); // 
        db.query('SELECT * FROM topic', (error, topics) => {
            if (error) throw error;
            var context = {
                title: 'Web Topic 테이블',
                who: name,      // mainFrame.ejs의 <%= who %>와 일치 [cite: 502, 904]
                login: login,   // mainFrame.ejs의 <%- login %>과 일치 [cite: 502, 904]
                cls: cls,       // mainFrame.ejs의 <%= cls %>와 일치 [cite: 502, 904]
                list: topics,
                menu: (cls !== 'NON') ? '<a href="/create">create</a>' : '',
                body: '<h2>Welcome</h2><p>Node.js Start Page</p>'
            };
            res.render('mainFrame', context, (err, html) => {
                if (err) console.error(err);
                res.end(html);
            });
        });
    },

    // 2. 상세 페이지 조회
    page: (req, res) => {
        var id = req.params.pageId;
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM topic', (error, topics) => {
            db.query(`SELECT * FROM topic LEFT JOIN author ON topic.author_id = author.id WHERE topic.id = ?`, [id], (error2, topic) => {
                if (error2) throw error2;
                var context = {
                    title: topic[0].title,
                    who: name,
                    login: login,
                    cls: cls,
                    list: topics,
                    menu: (cls !== 'NON') ? `<a href="/create">create</a>&nbsp;&nbsp;<a href="/update/${id}">update</a>&nbsp;&nbsp;<a href="/delete/${id}" onclick='return confirm("정말 삭제하시겠습니까?")'>delete</a>` : '',
                    body: `<h2>${topic[0].title}</h2><p>${topic[0].descript}</p><p><b>by ${topic[0].name}</b></p>`
                };
                res.render('mainFrame', context, (err, html) => res.end(html));
            });
        });
    },

    // 3. 토픽 생성 화면
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls === 'NON') return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        
        db.query('SELECT * FROM topic', (error, topics) => {
            db.query('SELECT * FROM author', (err, authors) => {
                var tag = '';
                for (var i = 0; i < authors.length; i++) tag += `<option value="${authors[i].id}">${authors[i].name}</option>`;
                var b = `<form action="/create_process" method="post">
                             <p><input type="text" name="title" placeholder="title"></p>
                             <p><textarea name="description" placeholder="description"></textarea></p>
                             <p><select name="author">${tag}</select></p>
                             <p><input type="submit" value="생성"></p>
                         </form>`;
                var context = {
                    title: 'Web Topic 생성',
                    who: name,
                    login: login,
                    cls: cls,
                    list: topics,
                    menu: '',
                    body: b
                };
                res.render('mainFrame', context, (err, html) => res.end(html));
            });
        });
    },

    // 4. 토픽 생성 처리
    create_process: (req, res) => {
        var post = req.body;
        db.query(`INSERT INTO topic (title, descript, created, author_id) VALUES(?, ?, NOW(), ?)`,
            [sanitizeHtml(post.title), sanitizeHtml(post.description), post.author],
            (error, result) => { res.redirect(`/page/${result.insertId}`); }
        );
    },

    // 5. 토픽 수정 화면
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls === 'NON') return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        
        var id = req.params.pageId;
        db.query('SELECT * FROM topic', (error, topics) => {
            db.query(`SELECT * FROM topic WHERE id = ?`, [id], (error2, topic) => {
                db.query('SELECT * FROM author', (error3, authors) => {
                    var tag = '';
                    for (var i = 0; i < authors.length; i++) {
                        var selected = authors[i].id === topic[0].author_id ? 'selected' : '';
                        tag += `<option value="${authors[i].id}" ${selected}>${authors[i].name}</option>`;
                    }
                    var b = `<form action="/update_process" method="post">
                                 <input type="hidden" name="id" value="${topic[0].id}">
                                 <p><input type="text" name="title" value="${topic[0].title}"></p>
                                 <p><textarea name="description">${topic[0].descript}</textarea></p>
                                 <p><select name="author">${tag}</select></p>
                                 <p><input type="submit" value="수정"></p>
                             </form>`;
                    var context = {
                        title: 'Topic Update',
                        who: name,
                        login: login,
                        cls: cls,
                        list: topics,
                        menu: '',
                        body: b
                    };
                    res.render('mainFrame', context, (err, html) => res.end(html));
                });
            });
        });
    },

    // 6. 토픽 수정 처리
    update_process: (req, res) => {
        var post = req.body;
        db.query(`UPDATE topic SET title = ?, descript = ?, author_id = ? WHERE id = ?`,
            [sanitizeHtml(post.title), sanitizeHtml(post.description), post.author, post.id],
            (error, result) => { res.redirect(`/page/${post.id}`); }
        );
    },

    // 7. 토픽 삭제 처리
    delete_process: (req, res) => {
        var { cls } = authIsOwner(req, res);
        if (cls === 'NON') return res.send("<script>alert('권한이 없습니다.'); location.href='/auth/login';</script>");
        
        var id = path.parse(req.params.pageId).base;
        db.query(`DELETE FROM topic WHERE id = ?`, [id], (error, result) => { 
            if (error) throw error;
            res.redirect('/'); 
        });
    },

    // 8. 로그인 화면
    login: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM topic', (error, topics) => {
            /**
            var b = `<h2>로그인</h2>
                     <form action="/auth/login_process" method="post">
                         <p><input type="text" name="loginid" placeholder="아이디" style="width:300px;"></p>
                         <p><input type="password" name="password" placeholder="비밀번호" style="width:300px;"></p>
                         <p><input class="btn btn-outline-secondary" type="submit" value="로그인"></p>
                     </form>`;
            **/
            var context = {
                title: 'Login',
                who: name,
                login: login,
                cls: cls,
                list: topics,
                menu: '',
                body: 'login.ejs'
            };
            res.render('mainFrame', context, (err, html) => res.end(html));
        });
    },

    // 9. 로그인 처리 (DB 기반으로 수정 권장되나 기존 로직 유지)
    login_process: (req, res) => {
        var post = req.body; 
        if (post.loginid === 'bhwang99@gachon.ac.kr' && post.password === '123456') {
            req.session.is_logined = true;
            req.session.name = '관리자';
            req.session.cls = 'admin';
            res.redirect('/');
        } else if (post.loginid === 'manager@test.com' && post.password === '123456') {
            req.session.is_logined = true;
            req.session.name = '경영자';
            req.session.cls = 'MNG';
            res.redirect('/');
        } else if (post.loginid === 'customer@test.com' && post.password === '123456') {
            req.session.is_logined = true;
            req.session.name = '고객';
            req.session.cls = 'CST';
            res.redirect('/');
        } else {
            res.send("<script>alert('정보가 일치하지 않습니다.'); location.href='/auth/login';</script>");
        }
    },

    // 10. 로그아웃 처리
    logout_process: (req, res) => {
        req.session.destroy(() => { res.redirect('/'); });
    },

    // 11. 이미지 업로드 화면
    upload: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM topic', (error, topics) => {
            var b = `<h3>이미지 업로드</h3>
                     <form action="/upload_process" method="post" enctype="multipart/form-data">
                         <input type="file" name="uploadFile">
                         <p><input style="margin-top:10px;" class="btn btn-outline-primary" type="submit" value="업로드 시작"></p>
                     </form>`;
            var context = {
                title: 'Image Upload',
                who: name,
                login: login,
                cls: cls,
                list: topics,
                menu: '',
                body: b
            };
            res.render('mainFrame', context, (err, html) => res.end(html));
        });
    }
};