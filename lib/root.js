// lib/root.js (메인 홈 화면 및 검색 컨트롤러)
const db = require('./db');
const auth = require('./auth');

module.exports = {
    /**
     * [1. 홈 화면 로직 - 메인 상품 목록 조회]
     * 목적: 사용자가 처음 사이트(localhost:3000/)에 접속했을 때,
     * 좌측 사이드바(카테고리, 게시판)와 중앙 메인 화면에 '전체 상품 목록'을 띄워줍니다.
     */
    home: (req, res) => {
        let ownerInfo;
        
        // 💡 [안전장치] 세션 인증 모듈(authIsOwner)을 실행하다가 오류가 발생해도
        // 서버 전체가 멈추지 않도록 try-catch문으로 감싸서 에러를 처리합니다.
        try {
            ownerInfo = auth.authIsOwner(req, res);
        } catch (authErr) {
            console.error("❌ auth.authIsOwner 실행 중 에러 발생:", authErr);
            return res.status(500).send("인증 모듈 에러 발생");
        }

        const { name, login, cls } = ownerInfo; // 추출한 유저 정보를 각각의 변수에 할당
        
        // 💡 [다중 쿼리 실행] 사이드바용 카테고리(code), 게시판(boardtype), 
        // 그리고 메인 화면용 상품 전체(product)를 한 번의 DB 요청으로 가져옵니다.
        const sql = 'SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product';
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error("❌ [MySQL DB 에러] 홈 화면 쿼리 실패:", err.message);
                return res.status(500).send("DB 쿼리 에러 발생");
            }

            // 💡 [데이터 안전 할당] DB에서 값이 비어있거나 제대로 오지 않았을 경우를 대비해 
            // 에러가 나지 않도록 빈 배열([])로 초기화해 줍니다.
            const categoryList = (results && results[0]) ? results[0] : [];
            const boardtypes = (results && results[1]) ? results[1] : [];
            const products = (results && results[2]) ? results[2] : [];

            // 뼈대 프레임(mainFrame.ejs)에 데이터를 담아서 브라우저로 전송합니다.
            res.render('mainFrame', {
                title: 'Gachon Shop',        // 브라우저 탭에 표시될 제목
                who: name,                   // 우측 상단 접속자 이름
                login: login,                // 로그인/로그아웃 버튼 아이콘
                cls: cls,                    // 사용자 권한 (버튼 노출 여부 결정 등에 사용)
                categoryList: categoryList,  // 좌측 사이드바 카테고리 메뉴 그리기용 데이터
                boardtypes: boardtypes,      // 좌측 사이드바 게시판 메뉴 그리기용 데이터
                results: products,           // 💡 메인 화면 중앙(product.ejs)에 뿌려줄 상품 전체 목록!
                body: 'product.ejs'          // 중앙 영역에 끼워 넣을 EJS 파일명
            });
        });
    },

    /**
     * [2. 🔍 검색 화면 로직 - 키워드 필터링]
     * 목적: 사용자가 좌측 상단 검색창에 단어를 입력하고 검색을 눌렀을 때,
     * 상품명, 브랜드, 공급업체 중 하나라도 그 단어가 포함된 상품만 추려서 보여줍니다.
     */
    search: (req, res) => {
        // 접속자 정보 추출
        const { name, login, cls } = auth.authIsOwner(req, res);
        
        // 💡 폼(Form)에서 POST 방식으로 날아온 검색어(name="search")를 추출합니다.
        const keyword = req.body.search; 

        // 💡 [검색 SQL 쿼리] LIKE 연산자를 사용하여 '부분 일치' 검색을 수행합니다.
        // name(상품명), brand(브랜드), supplier(공급업체) 중 하나라도 포함되면(OR) 결과를 가져옵니다.
        const sql = `
            SELECT * FROM code; 
            SELECT * FROM boardtype; 
            SELECT * FROM product 
            WHERE name LIKE ? OR brand LIKE ? OR supplier LIKE ?;
        `;
        
        // MySQL의 LIKE 검색을 위해 사용자가 입력한 단어 앞뒤로 '%' 와일드카드를 붙여줍니다.
        // 예: 입력값이 "셔츠"라면 "%셔츠%"가 되어, "흰색 셔츠", "셔츠 원피스" 등을 모두 찾습니다.
        const queryKeyword = `%${keyword}%`; 

        // 쿼리문에 물음표(?)가 3개이므로, 매핑할 파라미터 배열에도 queryKeyword를 3번 연속으로 넣어줍니다.
        db.query(sql, [queryKeyword, queryKeyword, queryKeyword], (err, results) => {
            if (err) {
                console.error("❌ [MySQL DB 에러] 검색 쿼리 실패:", err.message);
                return res.status(500).send("검색 중 에러가 발생했습니다.");
            }

            // 검색 결과 역시 데이터가 없을 경우를 대비해 안전하게 빈 배열 할당
            const categoryList = (results && results[0]) ? results[0] : [];
            const boardtypes = (results && results[1]) ? results[1] : [];
            const searchedProducts = (results && results[2]) ? results[2] : [];

            // 검색 완료 후, 전체 상품 보기 화면(product.ejs)과 껍데기는 똑같이 재사용하지만,
            // 알맹이 데이터(results)만 '검색된 상품 목록'으로 바꿔치기해서 화면에 그려줍니다!
            res.render('mainFrame', {
                title: 'Gachon Shop - 검색 결과',
                who: name,
                login: login,
                cls: cls,
                categoryList: categoryList,
                boardtypes: boardtypes,
                results: searchedProducts, // 💡 조건에 맞게 필터링된 상품 목록만 전달!
                body: 'product.ejs'
            });
        });
    }
};