// lib/topic.js
// 1. 필요한 외부 모듈 임포트
const db = require('./db'); // 데이터베이스 연결 설정
var sanitizeHtml = require('sanitize-html'); // 💡 악성 스크립트 주입(XSS 해킹)을 방지하기 위해 입력값을 소독해주는 모듈
var path = require('path'); // 파일 경로 및 URL 경로를 안전하게 다루기 위한 Node.js 기본 모듈

/**
 * 2. 공용 보안/인증 함수 (authIsOwner)
 * 목적: 사용자의 세션(Session) 정보를 확인하여 로그인 상태와 권한을 체크합니다.
 * 반환값: 뷰(EJS)에서 화면 상단을 그리는 데 필요한 name, login(아이콘 HTML), cls(권한) 객체
 */
function authIsOwner(req, res) {
    var name = 'Guest'; // 기본 비로그인 이름
    // 💡 EJS에서 <%- login %> 문법으로 렌더링하기 때문에 HTML 태그를 통째로 문자열로 넘깁니다.
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; 
    var cls = 'NON'; // 기본 권한 없음
    
    // 세션에 로그인 기록이 남아있다면 실제 정보로 덮어씌움
    if (req.session.is_logined) {
        // 이름 또는 닉네임 유연하게 가져오기
        name = req.session.name || req.session.nickname; 
        // 로그인 상태이므로 로그아웃 아이콘으로 링크와 모양 변경
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        // 세션에 저장된 권한(역할) 가져오기
        cls = req.session.cls || req.session.role; 
    }
    return { name, login, cls };
}

// 3. 외부 라우터에서 호출할 수 있도록 기능들을 내보냄 (Export)
module.exports = {
    /**
     * [1. 홈 화면 처리]
     * 목적: 기본 도메인 접속 시 전체 토픽(글) 목록과 환영 메시지를 띄워줍니다.
     */
    home: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res); 
        
        // DB에서 모든 토픽을 가져옵니다. (사이드바 메뉴 등에 출력하기 위함)
        db.query('SELECT * FROM topic', (error, topics) => {
            if (error) throw error;
            
            // 뼈대 프레임(mainFrame.ejs)에 전달할 데이터 꾸러미 구성
            var context = {
                title: 'Web Topic 테이블',
                who: name,      // 우측 상단 유저 이름 출력용
                login: login,   // 로그인/로그아웃 버튼 아이콘 출력용
                cls: cls,       // 권한 등급
                list: topics,   // 전체 토픽 리스트 데이터
                // 권한이 NON(비로그인)이 아닐 때만 'create(글쓰기)' 링크 메뉴를 보여줍니다.
                menu: (cls !== 'NON') ? '<a href="/create">create</a>' : '',
                // 메인 본문에 들어갈 내용을 문자열 HTML로 직접 작성하여 넘깁니다.
                body: '<h2>Welcome</h2><p>Node.js Start Page</p>'
            };
            
            // HTML 렌더링 후 클라이언트 브라우저로 전송
            res.render('mainFrame', context, (err, html) => {
                if (err) console.error(err);
                res.end(html);
            });
        });
    },

    /**
     * [2. 상세 페이지 조회]
     * 목적: 특정 토픽을 클릭했을 때 글의 상세 내용과 작성자 이름을 보여줍니다.
     */
    page: (req, res) => {
        var id = req.params.pageId; // URL에서 읽을 글 번호(id) 추출
        var { name, login, cls } = authIsOwner(req, res);
        
        db.query('SELECT * FROM topic', (error, topics) => {
            // 💡 LEFT JOIN 사용: topic 테이블의 작성자 번호(author_id)와 author 테이블의 고유 번호(id)를 연결하여 '작성자 이름'을 함께 가져옵니다.
            db.query(`SELECT * FROM topic LEFT JOIN author ON topic.author_id = author.id WHERE topic.id = ?`, [id], (error2, topic) => {
                if (error2) throw error2;
                
                var context = {
                    title: topic[0].title, // 브라우저 제목을 글 제목으로 설정
                    who: name, login: login, cls: cls, list: topics,
                    // 로그인한 사용자라면 상세 페이지 하단에 글쓰기(create), 수정(update), 삭제(delete) 링크 메뉴를 띄워줍니다.
                    menu: (cls !== 'NON') ? `<a href="/create">create</a>&nbsp;&nbsp;<a href="/update/${id}">update</a>&nbsp;&nbsp;<a href="/delete/${id}" onclick='return confirm("정말 삭제하시겠습니까?")'>delete</a>` : '',
                    // 본문 내용을 HTML 문자열로 직접 조립 (JOIN으로 가져온 topic[0].name이 작성자 이름입니다)
                    body: `<h2>${topic[0].title}</h2><p>${topic[0].descript}</p><p><b>by ${topic[0].name}</b></p>`
                };
                res.render('mainFrame', context, (err, html) => res.end(html));
            });
        });
    },

    /**
     * [3. 토픽 생성 화면 - Create View]
     * 목적: 새 글을 작성할 수 있는 입력 폼을 띄워줍니다.
     */
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        
        // 방어 코드: 로그인하지 않은 유저는 접근 불가
        if (cls === 'NON') return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        
        db.query('SELECT * FROM topic', (error, topics) => {
            // 작성자 선택 콤보박스(select)를 만들기 위해 author 테이블의 모든 유저를 가져옵니다.
            db.query('SELECT * FROM author', (err, authors) => {
                var tag = '';
                // 가져온 작성자 목록을 바탕으로 <option> 태그들을 반복문으로 생성합니다.
                for (var i = 0; i < authors.length; i++) tag += `<option value="${authors[i].id}">${authors[i].name}</option>`;
                
                // 생성 폼 HTML 조립
                var b = `<form action="/create_process" method="post">
                             <p><input type="text" name="title" placeholder="title"></p>
                             <p><textarea name="description" placeholder="description"></textarea></p>
                             <p><select name="author">${tag}</select></p>
                             <p><input type="submit" value="생성"></p>
                         </form>`;
                         
                var context = {
                    title: 'Web Topic 생성',
                    who: name, login: login, cls: cls, list: topics, menu: '',
                    body: b // 조립한 폼 HTML을 본문에 전달
                };
                res.render('mainFrame', context, (err, html) => res.end(html));
            });
        });
    },

    /**
     * [4. 토픽 생성 처리 로직 - Create Process]
     */
    create_process: (req, res) => {
        var post = req.body;
        
        // 💡 보안(Sanitize) 적용: 사용자가 게시글 제목이나 내용에 악성 자바스크립트 코드(<script>...</script>)를 
        // 입력하더라도, sanitizeHtml() 함수가 이를 안전한 문자열로 걸러내고 무력화시킵니다.
        db.query(`INSERT INTO topic (title, descript, created, author_id) VALUES(?, ?, NOW(), ?)`,
            [sanitizeHtml(post.title), sanitizeHtml(post.description), post.author],
            (error, result) => { 
                // 생성 완료 후, 방금 등록된 글 번호(result.insertId)의 상세 페이지로 즉시 이동
                res.redirect(`/page/${result.insertId}`); 
            }
        );
    },

    /**
     * [5. 토픽 수정 화면 - Update View]
     * 목적: 글을 수정하기 위해 기존 데이터가 미리 채워진 폼을 띄워줍니다.
     */
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls === 'NON') return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        
        var id = req.params.pageId;
        db.query('SELECT * FROM topic', (error, topics) => {
            // 수정할 특정 글 1개의 데이터 조회
            db.query(`SELECT * FROM topic WHERE id = ?`, [id], (error2, topic) => {
                // 작성자 선택 콤보박스를 그리기 위해 모든 작성자 정보 조회
                db.query('SELECT * FROM author', (error3, authors) => {
                    var tag = '';
                    for (var i = 0; i < authors.length; i++) {
                        // 💡 현재 글의 원래 작성자(topic[0].author_id)와 일치하는 option에 'selected' 속성을 부여하여 
                        // 콤보박스에 원래 작성자가 기본 선택되어 있도록 처리합니다.
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
                        title: 'Topic Update', who: name, login: login, cls: cls, list: topics, menu: '',
                        body: b
                    };
                    res.render('mainFrame', context, (err, html) => res.end(html));
                });
            });
        });
    },

    /**
     * [6. 토픽 수정 처리 로직 - Update Process]
     */
    update_process: (req, res) => {
        var post = req.body;
        // 생성과 동일하게 악성 스크립트를 방지(sanitizeHtml)하며 DB를 수정(UPDATE)합니다.
        db.query(`UPDATE topic SET title = ?, descript = ?, author_id = ? WHERE id = ?`,
            [sanitizeHtml(post.title), sanitizeHtml(post.description), post.author, post.id],
            (error, result) => { res.redirect(`/page/${post.id}`); }
        );
    },

    /**
     * [7. 토픽 삭제 처리 로직 - Delete Process]
     */
    delete_process: (req, res) => {
        var { cls } = authIsOwner(req, res);
        if (cls === 'NON') return res.send("<script>alert('권한이 없습니다.'); location.href='/auth/login';</script>");
        
        // 💡 보안(Path Traversal 방지): path.parse().base를 사용하면, 악의적인 사용자가 
        // 파라미터에 '../' 같은 상위 폴더 접근 코드를 넣더라도 파일명/순수아이디 부분만 안전하게 추출해냅니다.
        var id = path.parse(req.params.pageId).base;
        
        db.query(`DELETE FROM topic WHERE id = ?`, [id], (error, result) => { 
            if (error) throw error;
            res.redirect('/'); // 삭제 후 홈 화면으로 튕겨냄
        });
    },

    /**
     * [8. 로그인 화면]
     */
    login: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM topic', (error, topics) => {
            // 과거에는 문자열 HTML(주석 처리된 부분)을 썼으나, 현재는 별도의 login.ejs 파일을 이용합니다.
            var context = {
                title: 'Login', who: name, login: login, cls: cls, list: topics, menu: '',
                body: 'login.ejs'
            };
            res.render('mainFrame', context, (err, html) => res.end(html));
        });
    },

    /**
     * [9. 로그인 처리 로직]
     * 💡 주의: 이 코드는 DB 조회를 통한 로그인이 아니라 '하드코딩(코드에 직접 박아넣음)' 방식으로 짜여 있습니다.
     * 테스트용이나 과제 초기 단계의 구조이며, 실제 서비스에서는 person(회원) DB를 조회하는 방식으로 변경해야 합니다.
     */
    login_process: (req, res) => {
        var post = req.body; 
        
        // 관리자 테스트 계정 확인
        if (post.loginid === 'bhwang99@gachon.ac.kr' && post.password === '123456') {
            req.session.is_logined = true;
            req.session.name = '관리자';
            req.session.cls = 'admin'; // 최고 관리자 권한 부여
            res.redirect('/');
        } 
        // 경영자 테스트 계정 확인
        else if (post.loginid === 'manager@test.com' && post.password === '123456') {
            req.session.is_logined = true;
            req.session.name = '경영자';
            req.session.cls = 'MNG';
            res.redirect('/');
        } 
        // 고객 테스트 계정 확인
        else if (post.loginid === 'customer@test.com' && post.password === '123456') {
            req.session.is_logined = true;
            req.session.name = '고객';
            req.session.cls = 'CST';
            res.redirect('/');
        } 
        // 일치하는 하드코딩 계정이 없으면 로그인 창으로 반환
        else {
            res.send("<script>alert('정보가 일치하지 않습니다.'); location.href='/auth/login';</script>");
        }
    },

    /**
     * [10. 로그아웃 처리]
     * 목적: req.session.destroy()를 통해 서버 메모리에 기억된 사용자 로그인 세션을 완전히 파괴합니다.
     */
    logout_process: (req, res) => {
        req.session.destroy(() => { res.redirect('/'); });
    },

    /**
     * [11. 이미지 업로드 폼 화면]
     * 목적: 파일 업로드 기능을 테스트하기 위한 화면입니다.
     */
    upload: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM topic', (error, topics) => {
            // 💡 파일 업로드 HTML 핵심: 폼 전송 방식(enctype)이 반드시 "multipart/form-data" 이어야 
            // 텍스트가 아닌 실제 사진 파일 데이터가 서버(Multer 미들웨어 등)로 정상 전송됩니다.
            var b = `<h3>이미지 업로드</h3>
                     <form action="/upload_process" method="post" enctype="multipart/form-data">
                         <input type="file" name="uploadFile">
                         <p><input style="margin-top:10px;" class="btn btn-outline-primary" type="submit" value="업로드 시작"></p>
                     </form>`;
            var context = {
                title: 'Image Upload', who: name, login: login, cls: cls, list: topics, menu: '',
                body: b
            };
            res.render('mainFrame', context, (err, html) => res.end(html));
        });
    }
};