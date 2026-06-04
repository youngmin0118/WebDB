// lib/anal.js

// 1. 외부 모듈 및 설정 파일 임포트 (Import)
const db = require('./db'); // MySQL 데이터베이스 연결 설정을 담은 db.js 모듈을 가져옵니다.

/**
 * 2. 공용 보안/인증 함수 (authIsOwner)
 * 목적: 현재 접속한 사용자의 세션(Session) 정보를 검사하여 로그인 여부와 권한 등급을 판별합니다.
 * @param {Object} req - Express의 요청(Request) 객체
 * @param {Object} res - Express의 응답(Response) 객체
 * @returns {Object} { name, login, cls } - 템플릿(UI)에 전달할 가공된 유저 정보 객체
 */
function authIsOwner(req, res) {
    var name = 'Guest'; // 기본값: 비로그인 사용자는 'Guest'로 설정
    // 기본값: 비로그인 사용자는 로그인 아이콘(<i class="bx bx-log-in">)을 보여줌
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>';
    var cls = 'NON'; // 기본값: 권한 등급이 없는 일반 손님(NON) 상태

    // 서버 메모리(Session Store)에 로그인 상태(is_logined)가 참(true)으로 저장되어 있는지 체크
    if (req.session && req.session.is_logined) {
        name = req.session.name; // 실제 로그인한 회원의 한글 이름을 세션에서 가져옴
        // 로그인한 상태이므로 로그아웃 아이콘(<i class="bx bx-log-out">)으로 링크 전환
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls; // 회원의 실제 권한 등급('CST':고객, 'MNG':관리자, 'CEO':경영자)을 가져옴
    }
    
    // 구조 분해 할당을 위해 객체 형태로 결과물을 반환
    return { name, login, cls };
}

// 3. 외부 라우터에서 호출할 수 있도록 메소드들을 모듈화하여 내보냄 (Export)
module.exports = {
    
    /**
     * [경영자/관리자 전용 기능]customeranal 메소드
     * 목적: 회원의 지역별 주소 분포 비율을 통계 내어 브라우저 화면(Canvas HTML5)에 파이 차트로 전송합니다.
     * 경로: /anal/customer 주소와 매핑됨
     */
    customeranal: (req, res) => {
        // [단계 1] 공용 함수를 실행하여 현재 접속한 사람의 정보 및 권한 등급(cls)을 추출
        var { name, login, cls } = authIsOwner(req, res);
        
        // [단계 2] 접근 권한 방어 코드 (Access Control)
        // 경영자(CEO), 최고관리자(admin), 총괄매니저(MNG)가 아니라면 접근을 원천 차단
        if (cls !== 'CEO' && cls !== 'admin' && cls !== 'MNG') {
            return res.send("<script>alert('경영진 및 관리자만 접근 가능한 통계 화면입니다.'); location.href='/';</script>");
        }

        // [단계 3] 데이터베이스 다중 수행 SQL 쿼리 설계 (Multiple Statements)
        // ※ 이 쿼리가 한 번에 정상 실행되려면 db.js 설정에 multipleStatements: true 옵션이 켜져 있어야 합니다.
        var sql = `
            SELECT * FROM code; 
            SELECT * FROM boardtype;
            SELECT address, ROUND((count(*) / (select count(*) from person)) * 100, 2) as rate 
            FROM person GROUP BY address;
        `;
        /*
          💡 [SQL 쿼리 상세 세부 분석]
          - 쿼리 1 (SELECT * FROM code): 좌측 메뉴판(사이드바)의 대분류/소분류 쇼핑 카테고리를 그리기 위한 자원
          - 쿼리 2 (SELECT * FROM boardtype): 좌측 메뉴판에 등록된 게시판 목록(Q&A, 공지사항 등)을 그리기 위한 자원
          - 쿼리 3 (지역별 비율 계산 핵심 쿼리):
            1) FROM person GROUP BY address -> 가입된 회원들을 '주소(address)' 별로 그룹으로 묶음 (ex. 서울팀, 부산팀)
            2) count(*) -> 해당 지역에 속한 회원 수 계산
            3) (select count(*) from person) -> 서브쿼리를 이용하여 전체 회원 총합 수를 구함
            4) (count(*) / 전체수) * 100 -> 해당 지역 회원이 전체 중 차지하는 백분율(%) 계산
            5) ROUND(값, 2) -> 소수점 셋째 자리에서 반올림하여 깔끔하게 소수점 둘째 자리까지만 표기 (ex: 25.00)
            6) as rate -> 계산 결과를 'rate'라는 임시 별명 컬럼으로 지정
        */

        // [단계 4] MySQL DB 에 쿼리 요청 및 비동기 결과 처리
        db.query(sql, (err, results) => {
            // 데이터베이스 수행 중 오류(Syntax 에러, 연결 끊김 등) 발생 시 에러를 던지고 중단
            if (err) throw err;
            
            // [단계 5] 가공된 데이터를 뼈대 프레임(mainFrame.ejs)에 바인딩하여 클라이언트에 렌더링(HTML 전송)
            res.render('mainFrame', {
                title: '고객 지역별 분포 분석',    // 웹 브라우저 상단 탭에 출력될 제목
                who: name,                       // 대시보드 우측 상단에 띄울 사용자 이름 ('Guest' 또는 회원명)
                login: login,                    // 로그인/로그아웃 <a> 태그 아이콘 덩어리
                cls: cls,                        // 권한 등급 (EJS 내부에서 버튼 노출 여부를 분기할 때 사용)
                body: 'customerAnal.ejs',        // mainFrame.ejs 본문 가운데 띄울 알맹이 화면 파일 이름
                
                // 다중 쿼리 결과물(results)은 배열 안에 배열 형태로 들어옵니다. [[쿼리1결과], [쿼리2결과], [쿼리3결과]]
                categoryList: results[0],        // code 테이블 조회 결과 배열 (사이드바 카테고리용)
                boardtypes: results[1],          // boardtype 테이블 조회 결과 배열 (사이드바 게시판 목록용)
                percentage: results[2]           // 💡 핵심: 지역명(address)과 점유율(rate)이 담긴 통계 데이터 배열 (Canvas 차트 드로잉용)
            });
        });
    }
};