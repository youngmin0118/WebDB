// lib/auth.js
// 1. 외부 모듈 및 DB 설정 파일 임포트
var db = require('./db'); // MySQL 데이터베이스와 연결하기 위한 모듈
var sanitizeHtml = require('sanitize-html'); // 악성 스크립트 주입(XSS) 방지를 위한 모듈 (필요시 데이터 정제에 사용)

/**
 * 2. 공용 보안/인증 함수 (authIsOwner)
 * 목적: 현재 접속한 사용자의 세션(Session)을 확인하여, 로그인 상태와 권한을 체크합니다.
 * 이 함수는 모든 페이지에서 상단 헤더(유저 이름, 로그인/로그아웃 버튼)를 그릴 때 공통으로 사용됩니다.
 */
function authIsOwner(req, res) {
    // 기본값 설정 (비로그인 상태일 때 보여줄 기본 정보)
    var name = 'Guest'; // 이름: Guest
    // 로그인 버튼 아이콘 (비로그인 상태이므로 로그인 창으로 가는 링크 제공)
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; 
    var cls = 'NON'; // 권한 등급: NON (권한 없음)
    
    // 사용자의 브라우저 세션에 'is_logined' 값이 true로 기록되어 있다면 (로그인 성공 상태)
    if (req.session && req.session.is_logined) {
        name = req.session.name; // DB에서 가져온 실제 사용자 이름으로 덮어씀
        // 로그아웃 버튼 아이콘으로 변경 (클릭 시 로그아웃 프로세스로 이동)
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls; // DB에서 가져온 실제 사용자 권한(CST, MNG, CEO 등)으로 덮어씀
    }
    
    // 가공된 정보를 객체 형태로 반환하여 템플릿(EJS)에서 편하게 사용할 수 있도록 함
    return { name, login, cls };
}

// 3. 외부(라우터)에서 사용할 수 있도록 기능들을 모듈화하여 내보냄
module.exports = {
    // authIsOwner 함수 자체를 외부에서 가져다 쓸 수 있도록 노출 (ex: board.js, purchase.js 등에서 사용)
    authIsOwner: authIsOwner,

    /**
     * [로그인 화면 출력 메소드]
     * 경로: /auth/login
     */
    login: (req, res) => {
        // 현재 로그인 상태 정보를 가져옴 (로그인 화면의 UI를 그리기 위해 필요)
        const { name, login, cls } = authIsOwner(req, res);
        
        // 사이드바 메뉴를 그리기 위해 다중 쿼리로 카테고리(code)와 게시판 목록(boardtype)을 가져옴
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err; // 에러 발생 시 중단
            
            // 뼈대 프레임(mainFrame) 안에 로그인 폼(login.ejs)을 끼워 넣어서 브라우저에 전송
            res.render('mainFrame', {
                title: 'Login',              // 브라우저 탭 제목
                who: name,                   // 접속자 이름
                login: login,                // 로그인/로그아웃 버튼 UI
                cls: cls,                    // 사용자 권한
                categoryList: results[0],    // 사이드바 카테고리 자원
                boardtypes: results[1],      // 사이드바 게시판 자원
                body: 'login.ejs'            // 본문에 출력할 EJS 파일명
            });
        });
    },

    /**
     * [로그인 처리 프로세스]
     * 경로: /auth/login_process
     * 목적: 사용자가 폼에 입력한 아이디/비번을 검증하고 세션을 발급합니다.
     */
    login_process: (req, res) => {
        const post = req.body; // POST 방식으로 넘어온 폼 데이터(아이디, 비밀번호) 덩어리
        const loginid = post.loginid.trim();   // 아이디의 앞뒤 공백 제거
        const password = post.password.trim(); // 비밀번호의 앞뒤 공백 제거

        // 💡 [과제용 하드코딩 테스트 계정] 
        // 교수님의 과제 테스트 편의를 위해 DB 조회 없이 바로 세션을 통과시켜주는 '백도어(Backdoor)' 계정들입니다.
        if (loginid === 'admin' && password === '1234') {
            req.session.is_logined = true;    // 로그인 성공 플래그 설정
            req.session.loginid = 'admin';    // 세션에 아이디 저장
            req.session.name = '과제용관리자';  // 세션에 이름 저장
            req.session.cls = 'MNG';          // 총괄 관리자(MNG) 권한 부여
            return req.session.save(() => res.redirect('/')); // 세션을 메모리에 확정 저장한 뒤 메인 홈으로 리다이렉트
        } 
        else if (loginid === 'manager' && password === '1234') {
            req.session.is_logined = true;
            req.session.loginid = 'manager';
            req.session.name = '과제용경영진';
            req.session.cls = 'CEO';          // 경영자(CEO) 권한 부여
            return req.session.save(() => res.redirect('/'));
        }
        else if (loginid === 'user1' && password === '1234') {
            req.session.is_logined = true;
            req.session.loginid = 'user1';
            req.session.name = '고객1';
            req.session.cls = 'CST';          // 일반 고객(CST) 권한 부여
            return req.session.save(() => res.redirect('/'));
        }
        // [실제 데이터베이스 일반 유저 로그인 검증]
        else {
            // DB의 person 테이블에서 입력한 아이디/비번이 일치하는 회원이 있는지 조회
            db.query('SELECT name, class, loginid FROM person WHERE loginid = ? AND password = ?',
                [loginid, password], (error, results) => {
                    if (error) throw error; // 쿼리 에러 시 중단
                    
                    // results 배열의 길이가 0보다 크다면 = 일치하는 회원이 존재한다면
                    if (results.length > 0) {
                        req.session.is_logined = true;               // 로그인 성공 플래그
                        req.session.loginid = results[0].loginid;    // DB에서 가져온 아이디 저장
                        req.session.name = results[0].name;          // DB에서 가져온 실제 이름 저장
                        req.session.cls = results[0].class;          // DB에서 가져온 실제 권한 저장
                        // 세션 저장 후 메인 홈(/)으로 이동
                        req.session.save(() => res.redirect('/'));
                    } else {
                        // 일치하는 회원이 없다면(비밀번호가 틀렸거나 없는 아이디), 알림창을 띄우고 다시 로그인 화면으로 돌려보냄
                        res.send('<script>alert("아이디 또는 비밀번호 오류"); location.href="/auth/login";</script>');
                    }
                }
            );
        }
    },

    /**
     * [로그아웃 처리 프로세스]
     * 경로: /auth/logout_process
     */
    logout_process: (req, res) => {
        // req.session.destroy()를 호출하여 브라우저에 발급되었던 세션(is_logined, name 등)을 서버에서 완전히 삭제
        req.session.destroy(() => {
            res.redirect('/'); // 삭제가 완료되면 메인 홈으로 리다이렉트 (비로그인 상태인 'Guest'로 렌더링됨)
        });
    },

    /**
     * [회원가입 화면 출력 메소드]
     * 경로: /auth/register
     */
    register: (req, res) => {
        // 1. 방어 로직 (Access Control): 이미 로그인한 사용자가 주소창에 강제로 /auth/register를 치고 들어오는 것을 방지
        if (req.session.is_logined) {
            return res.redirect('/'); // 로그인 상태면 회원가입 화면을 보여주지 않고 메인 홈으로 튕겨냄
        }

        // 로그인 UI 처리를 위해 공용 함수 호출
        const { name, login, cls } = authIsOwner(req, res);
        
        // 2. 비로그인 사용자에게만 회원가입 폼(personCU.ejs)을 그려줌
        // 사이드바(메뉴판) 유지를 위해 code와 boardtype 테이블 정보도 함께 가져와 렌더링
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '회원가입',             // 브라우저 탭 제목
                who: name,                   // 상단 닉네임 (비로그인이므로 'Guest')
                login: login,                // 상단 로그인 버튼 아이콘
                cls: cls,                    // 권한 등급
                categoryList: results[0],    // 사이드바용 카테고리 데이터
                boardtypes: results[1],      // 사이드바용 게시판 데이터
                body: 'personCU.ejs'         // 메인 프레임 중앙에 끼워 넣을 회원가입 폼(UI) 파일
            });
        });
    }
};