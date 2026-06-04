// lib/purchase.js
// 1. 데이터베이스 연결 모듈 임포트
const db = require('./db');

/**
 * 2. 공용 보안/인증 함수 (authIsOwner)
 * 목적: 현재 접속한 사용자의 세션(Session)을 확인하여 로그인 상태와 권한을 반환합니다.
 */
function authIsOwner(req, res) {
    var name = 'Guest'; // 기본 비로그인 이름
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>'; // 기본 로그인 아이콘
    var cls = 'NON'; // 기본 권한 (없음)
    
    // 브라우저 세션에 로그인 기록이 남아있다면 실제 정보로 덮어씌움
    if (req.session && req.session.is_logined) {
        name = req.session.name;
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls;
    }
    return { name, login, cls };
}

/**
 * 3. 날짜 포맷팅 공용 함수 (getFormattedDate)
 * 목적: DB에 저장할 구매 일자, 장바구니 담은 일자를 요구사항에 맞는 예쁜 문자열로 변환합니다.
 * 형식: "YYYY.MM.DD: HH시 mm분 ss초"
 */
function getFormattedDate() {
    const date = new Date();
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1, 두 자리 맞춤
    const DD = String(date.getDate()).padStart(2, '0');
    const HH = date.getHours();
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${YYYY}.${MM}.${DD}: ${HH}시 ${mm}분 ${ss}초`;
}

// 외부 라우터에서 호출할 수 있도록 기능들을 내보냄 (Export)
module.exports = {
    // ===================================================================
    // 🛍️ [고객 기능] 상품 상세 및 장바구니/구매 프로세스
    // ===================================================================
    
    /**
     * [상품 상세 화면]
     * 목적: 고객이 상품을 클릭했을 때, 상세 정보와 수량 입력, 장바구니/구매 버튼이 있는 화면을 띄워줍니다.
     */
    purchasedetail: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var prodId = req.params.prodId; // URL에서 클릭한 상품의 ID를 가져옴
        
        // 다중 쿼리: 사이드바용 카테고리, 게시판 목록, 그리고 특정 상품(prod_id) 1개의 상세 정보를 가져옴
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product WHERE prod_id = ?', [prodId], (err, results) => {
            if (err) throw err;
            
            // 안전장치: DB에서 데이터가 제대로 안 넘어왔을 경우를 대비해 빈 배열/null 처리
            var categoryList = (results && results[0]) ? results[0] : [];
            var boardtypes = (results && results[1]) ? results[1] : [];
            var productData = (results && results[2] && results[2][0]) ? results[2][0] : null;

            res.render('mainFrame', {
                title: '구매 수량 선택',
                who: name, login: login, cls: cls, body: 'purchaseDetail.ejs',
                categoryList: categoryList,
                boardtypes: boardtypes,
                result: productData // 💡 상품 1개의 세부 데이터 전달
            });
        });
    },

    /**
     * [장바구니 담기 처리]
     * 목적: 장바구니 버튼을 눌렀을 때, 중복 여부를 체크하고 cart 테이블에 상품을 추가합니다.
     */
    cart_process: (req, res) => {
        var loginid = req.session.loginid;
        var prod_id = req.body.prod_id;
        var date = getFormattedDate(); // 현재 시간 포맷팅

        // 비로그인 방어: 로그인하지 않은 상태로 장바구니 버튼을 누르면 튕겨냄
        if (!req.session.is_logined) {
            return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        }

        // 💡 중복 체크 로직: 이미 장바구니에 똑같은 상품이 있는지 확인
        db.query('SELECT * FROM cart WHERE loginid = ? AND prod_id = ?', [loginid, prod_id], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                // 이미 있으면 담지 않고 경고창을 띄운 뒤 장바구니 화면으로 이동
                return res.send("<script>alert('장바구니에 이미 있는 제품입니다.'); location.href='/purchase/cart';</script>");
            } else {
                // 없으면 새로 insert
                db.query('INSERT INTO cart (loginid, prod_id, date) VALUES (?, ?, ?)', [loginid, prod_id, date], (err2) => {
                    if (err2) throw err2;
                    res.redirect('/purchase/cart'); // 성공 시 장바구니 목록으로 이동
                });
            }
        });
    },

    /**
     * [나의 장바구니 목록 보기]
     */
    cart: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var loginid = req.session.loginid; // 현재 접속한 유저의 아이디

        if (!req.session.is_logined) {
            return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        }

        // INNER JOIN: 장바구니(cart) 테이블에는 상품 ID만 있으므로, product 테이블과 조인하여 실제 상품명, 가격, 이미지를 가져옴
        var sql = `
            SELECT * FROM code; SELECT * FROM boardtype;
            SELECT c.cart_id, c.loginid, c.prod_id, c.date, p.name, p.price, p.image 
            FROM cart c INNER JOIN product p ON c.prod_id = p.prod_id 
            WHERE c.loginid = ?`;
            
        db.query(sql, [loginid], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '장바구니',
                who: name, login: login, cls: cls, body: 'cart.ejs',
                categoryList: results[0],
                boardtypes: results[1],
                results: results[2] // 화면에 출력할 장바구니 목록
            });
        });
    },

    /**
     * [단건 상품 즉시 구매 처리]
     * 목적: 장바구니를 거치지 않고 바로 '구매' 버튼을 눌렀을 때 purchase 테이블에 저장합니다.
     */
    pay_process: (req, res) => {
        var loginid = req.session.loginid;
        var prod_id = req.body.prod_id;
        var price = req.body.price;
        var qty = req.body.qty || 1; // 수량이 안 넘어오면 기본값 1
        var total = price * qty; // 총액 계산
        var point = Math.floor(total * 0.005); // 포인트 0.5% 적립 로직 (내림 처리)
        var date = getFormattedDate();

        if (!req.session.is_logined) {
            return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        }

        // 구매 내역 테이블에 정보 저장 (결제완료 여부 'Y', 취소여부 'N' 하드코딩)
        var sql = `INSERT INTO purchase (loginid, prod_id, date, price, point, qty, total, payYN, cancel) VALUES (?, ?, ?, ?, ?, ?, ?, 'Y', 'N')`;
        db.query(sql, [loginid, prod_id, date, price, point, qty, total], (err) => {
            if (err) throw err;
            res.redirect('/purchase'); // 결제 완료 후 나의 구매 내역으로 이동
        });
    },

    /**
     * [장바구니 항목 구매 이관 로직]
     * 목적: 장바구니에서 체크박스로 선택한 항목들을 결제했을 때, 장바구니에서는 비우고 구매 테이블로 옮깁니다.
     */
    cart_to_purchase_process: (req, res) => {
        var loginid = req.session.loginid;
        var checks = req.body.check; // 장바구니 화면에서 체크한 항목들의 cart_id 배열
        var date = getFormattedDate();

        if (!checks) {
            return res.send("<script>alert('구매할 상품을 선택해 주세요'); history.back();</script>");
        }

        // 체크박스가 하나만 선택되면 문자열로 넘어오므로, 항상 배열 형태로 통일
        var cartIds = Array.isArray(checks) ? checks : [checks];
        let completed = 0; // 비동기 DB 처리 완료 횟수를 체크하기 위한 변수

        // 선택된 각 장바구니 항목마다 순회하며 반복 실행
        cartIds.forEach((cartId) => {
            // 1단계: 장바구니와 상품 테이블을 조인하여 가격과 상품 번호를 알아냄
            db.query('SELECT c.*, p.price FROM cart c INNER JOIN product p ON c.prod_id = p.prod_id WHERE c.cart_id = ?', [cartId], (err, results) => {
                if (err) throw err;
                if (results.length > 0) {
                    var cartItem = results[0];
                    var qty = req.body['qty_' + cartId] || 1; // 폼에서 입력한 해당 항목의 구매 수량 추출
                    var price = cartItem.price;
                    var total = price * qty;
                    var point = Math.floor(total * 0.005);

                    // 2단계: 알아낸 정보를 바탕으로 purchase 테이블에 구매 이력 저장
                    var insSql = `INSERT INTO purchase (loginid, prod_id, date, price, point, qty, total, payYN, cancel) VALUES (?, ?, ?, ?, ?, ?, ?, 'Y', 'N')`;
                    db.query(insSql, [loginid, cartItem.prod_id, date, price, point, qty, total], (err2) => {
                        if (err2) throw err2;
                        
                        // 3단계: 구매 이력이 저장되었다면, 장바구니(cart) 테이블에서는 해당 항목을 삭제 (비워줌)
                        db.query('DELETE FROM cart WHERE cart_id = ?', [cartId], (err3) => {
                            if (err3) throw err3;
                            completed++;
                            // 비동기 처리: 배열의 길이만큼 DB 처리가 모두 완료되었을 때 마지막에 한 번만 리다이렉트 실행
                            if (completed === cartIds.length) {
                                res.redirect('/purchase'); // 나의 구매 내역으로 이동
                            }
                        });
                    });
                }
            });
        });
    },

    /**
     * [장바구니 특정 항목 삭제]
     * 목적: 1) 장바구니 화면에서 체크박스로 삭제할 때 (POST)
     * 2) 관리자 테이블 화면에서 삭제 링크를 누를 때 (GET) 둘 다 대응합니다.
     */
    cartdelete_process: (req, res) => {
        // 💡 방어 코드: POST로 넘어오면 req.body.check를 읽고, GET(관리자)으로 넘어오면 req.query.cart_id를 읽음
        var checks = (req.body && req.body.check) ? req.body.check : req.query.cart_id;
        
        if (!checks) {
            return res.send("<script>alert('삭제할 내역이 존재하지 않습니다.'); history.back();</script>");
        }
        
        var cartIds = Array.isArray(checks) ? checks : [checks];
        
        db.query('DELETE FROM cart WHERE cart_id IN (?)', [cartIds], (err) => {
            if (err) throw err;
            
            // 삭제를 호출한 주체가 관리자(admin='Y')면 테이블 관리 화면으로, 아니면 고객의 장바구니 화면으로 돌려보냄
            if (req.query.admin === 'Y') {
                res.redirect('/table/view/cart');
            } else {
                res.redirect('/purchase/cart');
            }
        });
    },

    /**
     * [나의 구매 이력 조회]
     */
    purchase: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var loginid = req.session.loginid;

        if (!req.session.is_logined) {
            return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        }

        // INNER JOIN으로 상품 테이블과 연결하여 상품명과 이미지를 함께 가져옴. 최신 구매순(ORDER BY pc.date DESC)
        var sql = `
            SELECT * FROM code; SELECT * FROM boardtype;
            SELECT pc.*, p.name, p.image 
            FROM purchase pc INNER JOIN product p ON pc.prod_id = p.prod_id 
            WHERE pc.loginid = ? ORDER BY pc.date DESC`;

        db.query(sql, [loginid], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '구매 내역',
                who: name, login: login, cls: cls, body: 'purchase.ejs',
                categoryList: results[0], boardtypes: results[1], results: results[2]
            });
        });
    },

    /**
     * [고객의 구매 취소 처리]
     * 목적: 고객이 구매 내역에서 '구매취소' 버튼을 눌렀을 때 DB 기록을 삭제하지 않고 취소 여부(cancel)만 'Y'로 업데이트함 (Soft Delete 기법)
     */
    cancel_process: (req, res) => {
        var purchaseId = req.params.purchaseId;
        db.query("UPDATE purchase SET cancel = 'Y' WHERE purchase_id = ?", [purchaseId], (err) => {
            if (err) throw err;
            res.redirect('/purchase');
        });
    },


    // ===================================================================
    // 🛠️ [관리자 권한] 어드민 테이블 메타데이터 총괄 관리 (CRUD)
    // ===================================================================
    
    /**
     * [1. 장바구니 관리자 수정 폼 화면]
     */
    cartupdate: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        // 권한 방어: 관리자 계정이 아니면 홈으로 튕겨냄
        if (cls !== 'MNG' && cls !== 'CEO' && cls !== 'admin') return res.redirect('/');
        var cartId = req.params.cartId;

        // 다중 쿼리: 장바구니 데이터 외에도 폼에 띄울 회원 목록(persons), 상품 목록(products)을 전부 셀렉트 박스용으로 가져옴
        var sql = `
            SELECT * FROM code; SELECT * FROM boardtype;
            SELECT * FROM cart WHERE cart_id = ?;
            SELECT loginid, name FROM person;
            SELECT prod_id, name FROM product`;

        db.query(sql, [cartId], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '장바구니 내역 수정',
                who: name, login: login, cls: cls, body: 'cartU.ejs',
                categoryList: results[0], boardtypes: results[1],
                cart: results[2][0], persons: results[3], products: results[4] // 💡 뷰로 전체 전달
            });
        });
    },

    /**
     * [2. 장바구니 관리자 수정 처리]
     */
    cartupdate_process: (req, res) => {
        var b = req.body;
        // 생성일자(date)는 읽기 전용으로 두어 불필요한 오류 방지, 로그인 아이디와 상품 번호만 수정 가능
        var sql = 'UPDATE cart SET loginid = ?, prod_id = ? WHERE cart_id = ?';
        db.query(sql, [b.loginid, b.prod_id, b.cart_id], (err) => {
            if (err) throw err;
            res.redirect('/table/view/cart'); // 수정 완료 시 테이블 총괄 관리(RUD) 메뉴로 이동
        });
    },

    /**
     * [3. 구매내역 관리자 수정 폼 화면]
     */
    purchaseupdate: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls !== 'MNG' && cls !== 'CEO' && cls !== 'admin') return res.redirect('/');
        var purchaseId = req.params.purchaseId;

        var sql = `
            SELECT * FROM code; SELECT * FROM boardtype;
            SELECT * FROM purchase WHERE purchase_id = ?;
            SELECT loginid, name FROM person;
            SELECT prod_id, name FROM product`;

        db.query(sql, [purchaseId], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '구매 내역 수정',
                who: name, login: login, cls: cls, body: 'purchaseU.ejs',
                categoryList: results[0], boardtypes: results[1],
                purchase: results[2][0], persons: results[3], products: results[4]
            });
        });
    }, 

    /**
     * [4. 구매내역 관리자 수정 처리]
     */
    purchaseupdate_process: (req, res) => {
        var b = req.body;
        // 관리자는 구매 내역의 거의 모든 정보(가격, 수량, 포인트, 결제상태, 취소여부)를 임의로 수정할 수 있음
        var sql = `
            UPDATE purchase 
            SET loginid = ?, prod_id = ?, price = ?, point = ?, qty = ?, total = ?, payYN = ?, cancel = ? 
            WHERE purchase_id = ?`;
            
        db.query(sql, [b.loginid, b.prod_id, b.price, b.point, b.qty, b.total, b.payYN, b.cancel, b.purchase_id], (err) => {
            if (err) throw err;
            res.redirect('/table/view/purchase'); // 수정 완료 시 테이블 총괄 관리(RUD) 메뉴로 이동
        });
    },

    /**
     * [5. 구매내역 관리자 강제 완전 삭제]
     * 목적: 관리자가 테이블 메뉴에서 삭제를 눌렀을 때, cancel 업데이트가 아닌 DB에서 물리적으로 삭제(Hard Delete)함
     */
    delete_process: (req, res) => {
        var purchaseId = req.query.purchase_id;
        db.query('DELETE FROM purchase WHERE purchase_id = ?', [purchaseId], (err) => {
            if (err) throw err;
            res.redirect('/table/view/purchase');
        });
    }
};