// lib/code.js (또는 해당 컨트롤러 파일)

// 1. 데이터베이스 연결 모듈 임포트
const db = require('./db');

/**
 * 2. 공용 보안/인증 함수 (authIsOwner)
 * 목적: 현재 접속한 사용자의 세션(Session)을 확인하여 로그인 상태와 권한을 체크합니다.
 */
function authIsOwner(req, res) {
    var name = 'Guest'; // 기본 이름
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; // 기본 비로그인 아이콘
    var cls = 'NON'; // 기본 권한
    
    // 세션에 로그인 정보가 존재한다면 (로그인 성공 상태)
    if (req.session.is_logined) {
        name = req.session.name; // 실제 사용자 이름
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>'; // 로그아웃 아이콘으로 변경
        cls = req.session.cls; // 사용자 권한 등급
    }
    return { name, login, cls }; // 추출한 정보를 객체로 묶어서 반환
}

// 3. 외부 라우터에서 호출할 수 있도록 기능들을 내보냄 (Export)
module.exports = {
    
    /**
     * [코드(카테고리) 목록 조회 화면]
     * 목적: DB에 저장된 쇼핑몰 대분류/소분류(code 테이블) 전체 목록을 표 형태로 보여줍니다.
     */
    view: (req, res) => {
        // 접속자 정보 추출
        var { name, login, cls } = authIsOwner(req, res);
        
        // 다중 쿼리 실행: 사이드바용 카테고리(code), 사이드바용 게시판(boardtype)을 동시에 가져옴
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (error, results) => {
            if (error) throw error;
            
            // 화면(mainFrame.ejs)으로 보낼 데이터 꾸러미(context) 생성
            var context = {
                title: 'Code 관리',          // 브라우저 탭 제목
                who: name, login: login, cls: cls, // 상단 유저 정보 및 권한
                body: 'code.ejs',            // 중앙에 끼워넣을 코드 목록 EJS 파일
                categoryList: results[0],    // 좌측 사이드바 메뉴용 카테고리 데이터
                boardtypes: results[1],      // 좌측 사이드바 메뉴용 게시판 데이터
                results: results[0]          // 💡 화면 중앙의 테이블(표)에 반복문으로 뿌려줄 실제 코드 데이터
            };
            res.render('mainFrame', context); // HTML 렌더링 후 클라이언트(브라우저)에 응답
        });
    },

    /**
     * [코드(카테고리) 생성 폼 화면]
     * 목적: 새로운 코드를 등록하기 위한 빈 입력 폼을 띄워줍니다.
     */
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (error, results) => {
            if (error) throw error;
            
            var context = {
                title: 'Code 생성', 
                who: name, login: login, cls: cls, 
                body: 'codeCU.ejs',          // 생성 및 수정을 공용으로 담당하는 폼 화면 파일(CU = Create/Update)
                categoryList: results[0],
                boardtypes: results[1]
            };
            res.render('mainFrame', context);
        });
    },

    /**
     * [코드(카테고리) 생성 처리 로직]
     * 목적: 생성 폼에서 입력한 정보(req.body)를 DB의 code 테이블에 추가(INSERT)합니다.
     */
    create_process: (req, res) => {
        var post = req.body; // 폼에서 전송된 데이터 덩어리
        
        // ?를 사용한 Parameterized Query (SQL 인젝션 해킹 방지)
        db.query(`INSERT INTO code (main_id, sub_id, main_name, sub_name, start, end) VALUES(?, ?, ?, ?, ?, ?)`,
            [post.main_id, post.sub_id, post.main_name, post.sub_name, post.start, post.end],
            (error, result) => {
                if (error) throw error;
                res.redirect('/code/view'); // 생성이 완료되면 성공 여부 확인을 위해 다시 목록 화면으로 자동 이동
            }
        );
    },

    /**
     * [코드(카테고리) 수정 폼 화면]
     * 목적: 기존 코드를 수정하기 위해, 폼의 인풋 칸에 기존 DB 데이터를 미리 채워놓은 화면을 띄워줍니다.
     */
    update: (req, res) => {
        const { name, login, cls } = authIsOwner(req, res); 
        // 💡 라우터 파라미터(:main/:sub/:start/:end)에서 데이터를 빼옴 (code 테이블은 식별 키가 여러 개라서 복잡함)
        const { main, sub, start, end } = req.params; 
        
        // 쿼리 1, 2: 사이드바용 / 쿼리 3: 특정 조건에 맞는 단 1개의 코드 정보만 추출
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM code WHERE main_id=? AND sub_id=? AND start=? AND end=?', 
            [main, sub, start, end], (error, results) => {
            if (error) throw error;
            
            var context = {
                title: 'Code 수정', 
                who: name, login: login, cls: cls, 
                body: 'codeCU.ejs',          // 동일한 폼을 사용하지만...
                categoryList: results[0],
                boardtypes: results[1],
                code: results[2][0]          // 💡 수정 폼에 미리 채워넣을 1개의 기존 데이터(code)를 통째로 전달
            };
            res.render('mainFrame', context);
        });
    },

    /**
     * [코드(카테고리) 수정 처리 로직]
     * 목적: 수정 폼에서 변경한 내용을 DB에 덮어씌웁니다(UPDATE).
     */
    update_process: (req, res) => {
        var post = req.body;
        
        // 💡 주의점: 수정 조건(WHERE)에 post.old_start를 사용하고 있습니다.
        // 식별자인 start 값을 사용자가 폼에서 다른 값으로 변경해버리면 DB에서 원래 데이터를 찾을 수 없기 때문에,
        // 폼에서 몰래(hidden) 넘겨준 원래의 옛날 start 값(old_start)을 기준으로 데이터를 찾아 수정합니다.
        db.query(`UPDATE code SET main_name=?, sub_name=?, start=?, end=? WHERE main_id=? AND sub_id=? AND start=?`,
            [post.main_name, post.sub_name, post.start, post.end, post.main_id, post.sub_id, post.old_start],
            (error, result) => {
                if (error) throw error;
                res.redirect('/code/view'); // 수정 후 목록으로 이동
            }
        );
    },

    /**
     * [코드(카테고리) 삭제 처리 로직]
     * 목적: 클릭한 코드의 고유 식별자(main_id, sub_id, start, end)를 이용해 해당 데이터만 DB에서 완전히 삭제합니다.
     */
    delete_process: (req, res) => {
        var { main, sub, start, end } = req.params; // 주소창 경로에서 변수를 빼옴
        
        db.query('DELETE FROM code WHERE main_id=? AND sub_id=? AND start=? AND end=?', 
            [main, sub, start, end], (error, result) => {
                if (error) throw error;
                res.redirect('/code/view'); // 삭제 후 목록으로 이동
        });
    }
};