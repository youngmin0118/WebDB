// lib/product.js (또는 상품 관리 컨트롤러 파일)

// 1. 데이터베이스 연결 모듈 임포트
const db = require('./db');

/**
 * 2. 공용 보안/인증 함수 (authIsOwner)
 * 목적: 현재 접속한 사용자의 세션(Session)을 확인하여 로그인 상태와 권한을 반환합니다.
 */
function authIsOwner(req, res) {
    var name = 'Guest'; // 기본 비로그인 이름
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; // 기본 로그인 아이콘
    var cls = 'NON'; // 기본 권한
    
    // 세션에 로그인 기록이 있다면 실제 정보로 덮어씌움
    if (req.session.is_logined) {
        name = req.session.name;
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls;
    }
    return { name, login, cls };
}

// 3. 외부 라우터에서 호출할 수 있도록 기능들을 내보냄 (Export)
module.exports = {
    
    /**
     * [1. 전체 상품 보기 화면 - Read All]
     * 목적: DB에 등록된 모든 상품(product)의 목록을 보여줍니다.
     */
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        
        // 다중 쿼리 실행: 사이드바용 카테고리, 게시판 목록, 그리고 본문용 '전체 상품 목록' 조회
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '상품 관리', 
                who: name, login: login, cls: cls, body: 'product.ejs', 
                categoryList: results[0], // 사이드바 대분류/소분류 메뉴용
                boardtypes: results[1],   // 사이드바 게시판 메뉴용
                results: results[2]       // 💡 화면 중앙에 뿌려줄 실제 상품 데이터 전체
            });
        });
    },

    /**
     * [2. 카테고리별 상품 필터링 보기 화면 - Read Filtered]
     * 목적: 사용자가 좌측 사이드바에서 특정 카테고리(예: 의류 -> 남성복)를 클릭했을 때 해당 상품만 추려서 보여줍니다.
     */
    categoryView: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        
        // 라우터(주소창)에서 전달받은 카테고리 식별자(대분류 ID, 소분류 ID)
        var main_id = req.params.mainId;
        var sub_id = req.params.subId;
        
        // WHERE 절을 사용하여 main_id와 sub_id가 일치하는 상품만 필터링하여 가져옵니다.
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product WHERE main_id = ? AND sub_id = ?', 
            [main_id, sub_id], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '상품 필터링', 
                who: name, login: login, cls: cls, body: 'product.ejs', // 전체 보기와 동일한 화면(product.ejs)을 재사용
                categoryList: results[0],
                boardtypes: results[1],
                results: results[2] // 💡 필터링된 상품 데이터만 화면에 전달
            });
        });
    },

    /**
     * [3. 상품 등록 폼 화면 - Create View]
     * 목적: 관리자가 새로운 상품을 등록하기 위한 빈 입력 폼을 띄워줍니다.
     */
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        
        // 💡 방어 코드: 관리자(admin)나 총괄매니저(MNG)가 아니면 메인 화면으로 강제 이동
        if (cls !== 'admin' && cls !== 'MNG') return res.redirect('/');
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '상품 등록', 
                who: name, login: login, cls: cls, body: 'productCU.ejs', // 상품 생성/수정 공용 폼
                results2: results[0],     // 💡 상품 등록 시 '카테고리 선택(Select box)'을 그리기 위한 데이터
                categoryList: results[0], // 사이드바용
                boardtypes: results[1]    // 사이드바용
            });
        });
    },

    /**
     * [4. 상품 등록 처리 로직 - Create Process]
     * 목적: 폼에서 입력한 텍스트 데이터와 이미지 파일 정보를 DB의 product 테이블에 저장합니다.
     */
    create_process: (req, res) => {
        var body = req.body;
        
        // 💡 Multer 미들웨어 처리: 이미지가 업로드되었다면 파일명(originalname)을 가져오고, 없으면 빈 문자열 처리
        var fileName = req.file ? req.file.originalname : '';
        
        // 💡 카테고리 분리 꼼수: 폼에서 넘어온 카테고리 값이 "대분류명:소분류명" (예: "0001:0001") 형태이므로
        // 콜론(:)을 기준으로 쪼개서(split) 각각 main_id와 sub_id 변수에 나누어 담습니다.
        const ids = body.category.split(':');
        const main_id = ids[0];
        const sub_id = ids[1];
        
        // DB에 모든 정보를 INSERT 합니다. (파일은 실제 물리 폴더에 저장되고, DB에는 '파일명'만 텍스트로 저장됩니다)
        db.query(`INSERT INTO product (main_id, sub_id, name, price, stock, brand, supplier, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [main_id, sub_id, body.name, body.price, body.stock, body.brand, body.supplier, fileName],
            (err, result) => {
                if (err) throw err;
                res.redirect('/product/view'); // 등록 후 상품 목록으로 이동
            }
        );
    },

    /**
     * [5. 상품 수정 폼 화면 - Update View]
     * 목적: 기존 상품의 정보를 수정하기 위해, 폼 인풋 칸에 기존 DB 데이터를 채워 넣은 화면을 띄워줍니다.
     */
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        
        if (cls !== 'admin' && cls !== 'MNG') return res.redirect('/'); // 권한 방어
        var id = req.params.updateId; // 주소창에서 수정할 상품의 ID를 추출
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product WHERE prod_id = ?', [id], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '상품 수정', 
                who: name, login: login, cls: cls, body: 'productCU.ejs',
                categoryList: results[0],
                boardtypes: results[1],
                product: results[2][0],   // 💡 수정 폼에 미리 채워넣을 특정 상품 1개의 데이터
                results2: results[0]      // 카테고리 선택(Select box)을 다시 그리기 위한 데이터
            });
        });
    },

    /**
     * [6. 상품 수정 처리 로직 - Update Process]
     * 목적: 폼에서 변경한 내용을 DB에 덮어씌웁니다. (이미지를 새로 올렸는지 여부에 따라 쿼리가 달라집니다)
     */
    update_process: (req, res) => {
        var body = req.body;
        var id = body.prod_id; // 수정할 대상 상품 ID
        
        // 새로 업로드된 이미지 파일이 있는지 확인
        var fileName = req.file ? req.file.originalname : null;
        
        const ids = body.category.split(':'); // 마찬가지로 넘어온 카테고리 값을 쪼갬
        const main_id = ids[0];
        const sub_id = ids[1];
        
        let sql, params;
        
        // 💡 동적 쿼리 생성:
        if (fileName) {
            // 1. 관리자가 이미지를 새로 업로드한 경우 -> 이미지(image) 컬럼도 새로운 파일명으로 업데이트
            sql = `UPDATE product SET main_id=?, sub_id=?, name=?, price=?, stock=?, brand=?, supplier=?, image=? WHERE prod_id=?`;
            params = [main_id, sub_id, body.name, body.price, body.stock, body.brand, body.supplier, fileName, id];
        } else {
            // 2. 관리자가 이미지는 건드리지 않고 텍스트(이름, 가격 등)만 수정한 경우 -> 이미지 컬럼은 쿼리에서 빼고 기존 이미지 유지
            sql = `UPDATE product SET main_id=?, sub_id=?, name=?, price=?, stock=?, brand=?, supplier=? WHERE prod_id=?`;
            params = [main_id, sub_id, body.name, body.price, body.stock, body.brand, body.supplier, id];
        }
        
        // 완성된 쿼리와 파라미터를 실행
        db.query(sql, params, (err, result) => {
            if (err) throw err;
            res.redirect('/product/view'); // 수정 후 상품 목록으로 이동
        });
    },

    /**
     * [7. 상품 삭제 처리 로직 - Delete Process]
     * 목적: 특정 상품 ID를 이용해 해당 상품을 DB에서 완전히 삭제합니다.
     */
    delete_process: (req, res) => {
        // 주소창 파라미터(:deleteId)에서 삭제할 대상 ID를 가져와 삭제 쿼리 실행
        db.query('DELETE FROM product WHERE prod_id = ?', [req.params.deleteId], (err, result) => {
            if (err) throw err;
            res.redirect('/product/view'); // 삭제 후 상품 목록으로 이동
        });
    }
};