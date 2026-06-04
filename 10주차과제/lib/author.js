
const db = require('./db');
var sanitizeHtml = require('sanitize-html');
var path = require('path');

//  세션 정보를 확인하여 사용자 정보를 객체로 반환하는 함수
function authIsOwner(req, res) {
    var name = 'Guest';
    // mainFrame.ejs에서 <%- login %>으로 출력하므로 HTML 태그를 문자열로 만듭니다.
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; 
    var cls = 'NON';
    
    if (req.session.is_logined) {
        name = req.session.name || req.session.nickname;
        // 로그인 상태일 때는 로그아웃 아이콘으로 변경
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls || req.session.role;
    }
    return { name, login, cls };
}

module.exports = {
    // 1. 저자 관리 메인 화면 (생성 폼 + 목록)
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);

        db.query('SELECT * FROM topic', (err, topics) => {
            if (err) throw err;

            db.query('SELECT * FROM author', (err2, authors) => {
                if (err2) throw err2;

                // 저자 목록 테이블 생성
                var tag = '<table class="table table-bordered">';
                tag += '<tr><th>Name</th><th>Profile</th><th>Update</th><th>Delete</th></tr>';
                for (var i = 0; i < authors.length; i++) {
                    tag += `<tr>
                                <td>${sanitizeHtml(authors[i].name)}</td>
                                <td>${sanitizeHtml(authors[i].profile)}</td>
                                <td><a href="/author/update/${authors[i].id}">update</a></td>
                                <td><a href="/author/delete/${authors[i].id}" 
                                    onclick='if(confirm("정말로 삭제하시겠습니까?")==false){return false}'>
                                    delete</a></td>
                            </tr>`;
                }
                tag += '</table>';

                // 저자 생성 폼
                var b = `<form action='/author/create_process' method='post'>
                             <p><input type='text' name='name' placeholder='이름'></p>
                             <p><input type='text' name='profile' placeholder='프로필'></p>
                             <p><input type='submit' value='저자 생성'></p>
                         </form>`;

                var context = {
                    title: 'Author 관리',
                    who: name,      // mainFrame.ejs의 <%= who %>와 일치
                    login: login,   // mainFrame.ejs의 <%- login %>과 일치
                    cls: cls,       // mainFrame.ejs의 <%= cls %>와 일치
                    list: topics,
                    menu: tag,      // 저자 목록 테이블
                    body: b         // 저자 생성 폼
                };

                res.render('mainFrame', context, (err, html) => res.end(html));
            });
        });
    },

    // 2. 저자 생성 처리 
    create_process: (req, res) => {
        var post = req.body; 
        db.query(`INSERT INTO author (name, profile) VALUES(?, ?)`,
            [sanitizeHtml(post.name), sanitizeHtml(post.profile)],
            (error, result) => {
                if (error) throw error;
                res.redirect('/author');
            }
        );
    },

    // 3. 저자 수정 화면
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var id = req.params.id;

        db.query('SELECT * FROM topic', (err, topics) => {
            db.query(`SELECT * FROM author WHERE id = ?`, [id], (err2, author) => {
                db.query('SELECT * FROM author', (err3, authors) => {
                    var tag = '<table class="table table-bordered"><tr><th>Name</th><th>Profile</th><th>Update</th><th>Delete</th></tr>';
                    for (var i = 0; i < authors.length; i++) {
                        tag += `<tr>
                                    <td>${sanitizeHtml(authors[i].name)}</td>
                                    <td>${sanitizeHtml(authors[i].profile)}</td>
                                    <td><a href="/author/update/${authors[i].id}">update</a></td>
                                    <td><a href="/author/delete/${authors[i].id}" onclick='return confirm("정말 삭제?")'>delete</a></td>
                                </tr>`;
                    }
                    tag += '</table>';

                    var b = `<form action='/author/update_process' method='post'>
                                 <input type='hidden' name='id' value='${id}'>
                                 <p><input type='text' name='name' value='${sanitizeHtml(author[0].name)}'></p>
                                 <p><input type='text' name='profile' value='${sanitizeHtml(author[0].profile)}'></p>
                                 <p><input type='submit' value='수정 완료'></p>
                             </form>`;

                    var context = {
                        title: 'Author Update',
                        who: name,
                        login: login,
                        cls: cls,
                        list: topics,
                        menu: tag,
                        body: b
                    };
                    res.render('mainFrame', context, (err, html) => res.end(html));
                });
            });
        });
    },

    // 4. 저자 수정 처리 
    update_process: (req, res) => {
        var post = req.body;
        db.query(`UPDATE author SET name = ?, profile = ? WHERE id = ?`,
            [sanitizeHtml(post.name), sanitizeHtml(post.profile), post.id],
            (error, result) => {
                if (error) throw error;
                res.redirect('/author');
            }
        );
    },

    // 5. 저자 삭제 처리
    delete_process: (req, res) => {
        var id = path.parse(req.params.id).base;
        db.query(`DELETE FROM author WHERE id = ?`, [id], (error, result) => {
            if (error) throw error;
            res.redirect('/author');
        });
    }
};