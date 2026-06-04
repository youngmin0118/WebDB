// router/tableManageRouter.js (데이터베이스 테이블 총괄 관리 라우터)

// 1. 필요한 외부 모듈 가져오기
const express = require('express');
const router = express.Router(); // 접속 경로를 목적지로 안내해 줄 길잡이(라우터) 생성
const db = require('../lib/db'); // 데이터베이스 연결 설정 모듈 바인딩

/**
 * 2. 공용 보안/인증 함수 (authIsOwner)
 * 프로젝트 공통 규격: 세션 상태를 추적하여 사용자 권한 및 닉네임, 로그인 UI 요소(태그)를 파싱합니다.
 */
function authIsOwner(req, res) {
    var name = 'Guest';
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>';
    var cls = 'NON';
    
    if (req.session && req.session.is_logined) {
        name = req.session.name;
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls;
    }
    return { name, login, cls };
}

// ==============================================================================
// 💡 알림: 메인 라우터(rootRouter.js)에서 router.use('/table', tableManageRouter)로 
// 연결했기 때문에, 이곳의 주소들은 자동으로 맨 앞에 '/table'이 붙습니다.
// ==============================================================================

/**
 * [경로 1] DB 테이블 목록 관리 화면 (교재 2페이지)
 * 실제 주소: localhost:3000/table
 * 목적: 현재 DB에 존재하는 모든 테이블의 이름과 설명을 목록 형태로 보여줍니다.
 */
router.get('/', (req, res) => {
    var { name, login, cls } = authIsOwner(req, res);
    
    // 💡 DB Admin 메뉴 접근 방어선: 일반 유저나 고객이 이 주소를 치고 들어오면 튕겨냅니다.
    // 오직 경영자(CEO)와 최고관리자(MNG)만 접근 가능합니다.
    if (cls !== 'MNG' && cls !== 'CEO') {
        return res.send("<script>alert('데이터베이스 관리자 권한이 필요합니다.'); location.href='/';</script>");
    }

    // 사이드바 전용 메뉴 데이터와 'INFORMATION_SCHEMA' 물리 테이블 명세 통합 멀티 쿼리
    // 💡 INFORMATION_SCHEMA.TABLES 란? 
    // 우리가 만든 데이터가 아니라, MySQL이 스스로 '어떤 테이블들이 만들어져 있는지' 
    // 관리하기 위해 몰래 가지고 있는 시스템 전용 메타데이터 테이블입니다!
    const sql = `
        SELECT * FROM code; 
        SELECT * FROM boardtype; 
        SELECT TABLE_NAME, TABLE_COMMENT 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'webdb2026' AND TABLE_TYPE = 'BASE TABLE';
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ 테이블 메타데이터 조회 실패:", err);
            return res.status(500).send('DB 메타데이터 테이블 목록을 검색하는 중 오류가 발생했습니다.');
        }

        // mainFrame.ejs 뼈대 양식과 테이블 목록(tableManage.ejs) 구조를 100% 만족하는 바인딩 객체
        res.render('mainFrame', {
            title: 'Table Manage', 
            who: name, 
            login: login, 
            cls: cls, 
            body: 'tableManage.ejs',      // 레이아웃 본문 중앙에 결합할 대상 EJS 파일
            categoryList: results[0],    // 사이드바 카테고리 루프용 데이터
            boardtypes: results[1],      // 사이드바 게시판 루프용 데이터
            results: results[2]          // 💡 tableManage.ejs 본문 표에 매핑될 실제 '테이블 목록' 배열
        });
    });
});

/**
 * [경로 2] 특정 테이블 내부 데이터 상세 보기 화면
 * 실제 주소: /table/view/테이블이름 (예: /table/view/product)
 * 목적: 클릭한 테이블 안에 들어있는 실제 데이터 열(Row)과 컬럼 정보들을 보여줍니다.
 */
router.get('/view/:tableName', (req, res) => {
    var { name, login, cls } = authIsOwner(req, res);
    
    // 주소창에서 클릭한 테이블의 이름(예: person, product 등)을 빼옵니다.
    var tableName = req.params.tableName;

    // 권한 재검증
    if (cls !== 'MNG' && cls !== 'CEO') {
        return res.redirect('/');
    }

    // 💡 [보안의 핵심: SQL 인젝션 방어선 (화이트리스트 기법)]
    // 사용자가 주소창에 /table/view/이상한해킹코드 라고 입력했을 때 DB가 털리는 것을 막기 위해,
    // 우리가 허용한 진짜 테이블 이름들만 미리 배열로 묶어둡니다.
    const allowedTables = ['appslist', 'author', 'board', 'boardtype', 'cart', 'code', 'person', 'product', 'purchase', 'sessions', 'topic'];
    
    // 만약 주소창으로 들어온 테이블 이름이 위 배열에 포함되어 있지 않다면(includes가 false면) 튕겨냅니다!
    if (!allowedTables.includes(tableName)) {
        return res.send("<script>alert('유효하지 않은 테이블 접근입니다.'); history.back();</script>");
    }

    // 멀티 쿼리 구성
    // 1번 쿼리: 사이드바용 카테고리 (code)
    // 2번 쿼리: 사이드바용 게시판 (boardtype)
    // 3번 쿼리: 헤더에 표시할 한글 코멘트용 (INFORMATION_SCHEMA.COLUMNS) -> 테이블의 '열(Column) 이름'들을 가져옴
    // 4번 쿼리: 본문에 표시할 실제 테이블 데이터용 (SELECT * FROM 테이블명) -> 위에서 검증된 가변 테이블 이름을 백틱(`)으로 감싸서 동적 쿼리로 만듭니다.
    const sql = `
        SELECT * FROM code; 
        SELECT * FROM boardtype;
        SELECT COLUMN_NAME, COLUMN_COMMENT 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'webdb2026' AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION ASC;
        SELECT * FROM \`${tableName}\`;
    `;

    db.query(sql, [tableName], (err, results) => {
        if (err) {
            console.error("❌ 데이터 테이블 조회 실패:", err);
            return res.status(500).send('테이블 데이터를 파싱하는 중 오류가 발생했습니다.');
        }

        res.render('mainFrame', {
            title: tableName + ' 자료 목록', 
            who: name, 
            login: login, 
            cls: cls, 
            body: 'tableView.ejs',
            categoryList: results[0],
            boardtypes: results[1],
            tableName: tableName, // 현재 보고 있는 테이블의 영어 이름
            columns: results[2],  // 💡 테이블의 구조(한글/영문 컬럼명) 정보 전달
            rows: results[3]      // 💡 테이블 안에 들어있는 실제 데이터(Rows) 전달
        });
    });
});

module.exports = router;