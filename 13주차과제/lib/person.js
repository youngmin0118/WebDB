// lib/person.js (또는 회원 관리 컨트롤러 파일)

// 1. 데이터베이스 연결 모듈 임포트
const db = require('./db');

/**
 * 2. 공용 보안/인증 함수 (authIsOwner)
 * 목적: 현재 접속한 사용자의 세션(Session)을 확인하여 로그인 상태와 권한을 추출합니다.
 */
function authIsOwner(req, res) {
    var name = 'Guest'; // 기본값 (비로그인)
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; // 기본 로그인 아이콘
    var cls = 'NON'; // 기본 권한 (없음)
    
    // 세션에 로그인 기록이 남아있다면
    if (req.session.is_logined) {
        name = req.session.name; // 실제 회원의 이름
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>'; // 로그아웃 아이콘으로 변경
        cls = req.session.cls; // 회원의 권한 등급 (CST, MNG, CEO 등)
    }
    return { name, login, cls }; // 객체 형태로 반환하여 뷰(EJS)에서 사용하기 편하게 함
}

// 3. 외부 라우터에서 호출할 수 있도록 기능들을 내보냄 (Export)
module.exports = {
    
    /**
     * [회원 목록 조회 화면 - Read]
     * 목적: DB에 가입된 모든 회원(person 테이블)의 목록을 표 형태로 보여줍니다.
     */
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        
        // 다중 쿼리 실행: 사이드바용 카테고리(code), 게시판(boardtype), 그리고 메인 화면용 회원 목록(person)을 동시에 가져옴
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM person', (error, results) => {
            if (error) throw error;
            
            // 화면(mainFrame.ejs)으로 보낼 데이터 꾸러미 생성
            var context = {
                title: '회원 관리',           // 브라우저 탭 제목
                who: name, login: login, cls: cls, // 상단 유저 정보 및 권한
                body: 'person.ejs',          // 중앙에 끼워넣을 회원 목록 EJS 파일
                categoryList: results[0],    // 사이드바 카테고리 데이터
                boardtypes: results[1],      // 사이드바 게시판 데이터
                results: results[2]          // 💡 화면 중앙의 테이블(표)에 뿌려줄 실제 회원 목록 데이터
            };
            
            // res.render의 콜백 함수 방식을 사용하여 HTML 렌더링 후 클라이언트에 응답
            res.render('mainFrame', context, (err, html) => { res.end(html); });
        });
    },

    /**
     * [회원 생성 폼 화면 - Create View]
     * 목적: 관리자가 새로운 회원을 직접 등록하거나, 사용자가 회원가입을 할 때 사용하는 빈 입력 폼을 띄워줍니다.
     */
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (error, results) => {
            if (error) throw error;
            
            var context = {
                title: '회원 생성',
                who: name, login: login, cls: cls,
                body: 'personCU.ejs',        // 회원 생성과 수정을 공용으로 담당하는 폼 화면(CU = Create/Update)
                categoryList: results[0],
                boardtypes: results[1]
            };
            res.render('mainFrame', context, (err, html) => { res.end(html); });
        });
    },

    /**
     * [회원 생성 처리 로직 - Create Process]
     * 목적: 폼에서 입력한 정보(req.body)를 DB의 person 테이블에 추가(INSERT)합니다.
     */
    create_process: (req, res) => {
        var post = req.body; // 폼에서 넘어온 데이터 덩어리
        
        // ?(플레이스홀더)를 사용하여 SQL 인젝션 해킹을 방지하는 안전한 쿼리 방식
        db.query(`INSERT INTO person (loginid, password, name, mf, address, tel, birth, class) 
                  VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
            [post.loginid, post.password, post.name, post.mf, post.address, post.tel, post.birth, post.class],
            (error, result) => {
                if (error) throw error;
                res.redirect('/person/view'); // 가입/생성 완료 후 회원 목록 화면으로 자동 이동
            }
        );
    },

    /**
     * [회원 정보 수정 폼 화면 - Update View]
     * 목적: 기존 회원의 정보를 수정하기 위해, 폼 인풋 칸에 기존 DB 데이터를 미리 채워놓은 화면을 띄워줍니다.
     */
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var loginId = req.params.loginId; // 주소창(라우터 파라미터)에서 수정할 회원의 ID를 가져옴
        
        // 쿼리 1, 2: 사이드바용 / 쿼리 3: 특정 아이디(loginId)를 가진 회원 1명의 정보만 추출
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM person WHERE loginid = ?', [loginId], (error, results) => {
            if (error) throw error;
            
            var context = {
                title: '회원 수정',
                who: name, login: login, cls: cls,
                body: 'personCU.ejs',        // 생성할 때와 동일한 폼을 사용
                categoryList: results[0],
                boardtypes: results[1],
                person: results[2][0]        // 💡 수정 폼에 미리 채워넣을 1명의 기존 데이터(person)를 전달
            };
            res.render('mainFrame', context, (err, html) => { res.end(html); });
        });
    },

    /**
     * [회원 정보 수정 처리 로직 - Update Process]
     * 목적: 폼에서 변경한 내용을 DB에 덮어씌웁니다(UPDATE).
     */
    update_process: (req, res) => {
        var post = req.body;
        
        // 💡 주의점: 수정 조건(WHERE)에 post.loginid를 사용합니다. 
        // 아이디(loginid)는 기본키(PK)이므로 변경할 수 없고, 나머지 정보(비밀번호, 이름, 권한 등)만 업데이트합니다.
        db.query(`UPDATE person SET password=?, name=?, mf=?, address=?, tel=?, birth=?, class=? 
                  WHERE loginid=?`,
            [post.password, post.name, post.mf, post.address, post.tel, post.birth, post.class, post.loginid],
            (error, result) => {
                if (error) throw error;
                res.redirect('/person/view'); // 수정 후 목록으로 이동
            }
        );
    },

    /**
     * [회원 삭제 처리 로직 - Delete Process]
     * 목적: 클릭한 회원의 아이디(loginId)를 이용해 해당 회원을 DB에서 완전히 삭제합니다.
     */
    delete_process: (req, res) => {
        var loginId = req.params.loginId; // 주소창에서 삭제할 회원의 아이디를 빼옴
        
        db.query('DELETE FROM person WHERE loginid = ?', [loginId], (error, result) => {
            if (error) throw error;
            res.redirect('/person/view'); // 삭제 후 목록으로 이동
        });
    }
};