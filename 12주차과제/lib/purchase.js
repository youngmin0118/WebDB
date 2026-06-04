// lib/purchase.js
const db = require('./db');

// 세션 정보를 확인하는 공용 함수 (안전한 방어 코드 적용)
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

// 날짜 포맷 함수 (YYYY.MM.DD: HH시 mm분 ss초 형태)
function getFormattedDate() {
    const date = new Date();
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const DD = String(date.getDate()).padStart(2, '0');
    const HH = date.getHours();
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${YYYY}.${MM}.${DD}: ${HH}시 ${mm}분 ${ss}초`;
}

module.exports = {
    // [고객] 상품 상세 화면 및 직접 구매/장바구니 분점 (교안 10~11페이지)
    purchasedetail: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var prodId = req.params.prodId;
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product WHERE prod_id = ?', [prodId], (err, results) => {
            if (err) {
                console.error("DB 에러 발생:", err);
                return res.status(500).send("데이터베이스 에러 발생");
            }
            
            var categoryList = (results && results[0]) ? results[0] : [];
            var boardtypes = (results && results[1]) ? results[1] : [];
            var productData = (results && results[2] && results[2][0]) ? results[2][0] : null;

            res.render('mainFrame', {
                title: '구매 수량 선택',
                who: name, login: login, cls: cls, body: 'purchaseDetail.ejs',
                categoryList: categoryList,
                boardtypes: boardtypes,
                result: productData
            });
        });
    },

    // [고객] 장바구니 담기 프로세스 (교안 20페이지 중복 체크 반영)
    cart_process: (req, res) => {
        var loginid = req.session.loginid;
        var prod_id = req.body.prod_id;
        var date = getFormattedDate();

        if (!req.session.is_logined) {
            return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        }

        db.query('SELECT * FROM cart WHERE loginid = ? AND prod_id = ?', [loginid, prod_id], (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                return res.send("<script>alert('장바구니에 이미 있는 제품입니다.'); location.href='/purchase/cart';</script>");
            } else {
                db.query('INSERT INTO cart (loginid, prod_id, date) VALUES (?, ?, ?)', [loginid, prod_id, date], (err2) => {
                    if (err2) throw err2;
                    res.redirect('/purchase/cart');
                });
            }
        });
    },

    // [고객] 장바구니 목록 조회 (교안 18~19페이지)
    cart: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var loginid = req.session.loginid;

        if (!req.session.is_logined) {
            return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        }

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
                results: results[2]
            });
        });
    },

    // [고객] 단건 상품 직접 결제 처리 프로세스
    pay_process: (req, res) => {
        var loginid = req.session.loginid;
        var prod_id = req.body.prod_id;
        var price = req.body.price;
        var qty = req.body.qty;
        var total = price * qty;
        var point = Math.floor(total * 0.005); // 포인트 0.5% 적립
        var date = getFormattedDate();

        if (!req.session.is_logined) {
            return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        }

        var sql = `INSERT INTO purchase (loginid, prod_id, date, price, point, qty, total, payYN, cancel) VALUES (?, ?, ?, ?, ?, ?, ?, 'Y', 'N')`;
        
        db.query(sql, [loginid, prod_id, date, price, point, qty, total], (err) => {
            if (err) throw err;
            res.redirect('/purchase'); 
        });
    },

    // [고객] 장바구니 체크 항목 결제 -> 구매 이관 및 카트 제거 (교안 22~25페이지 설계도 구조)
    cart_to_purchase_process: (req, res) => {
        var loginid = req.session.loginid;
        var checks = req.body.check; 
        var date = getFormattedDate();

        if (!checks) {
            return res.send("<script>alert('구매할 상품을 선택해 주세요'); history.back();</script>");
        }

        var cartIds = Array.isArray(checks) ? checks : [checks];
        let completed = 0;

        cartIds.forEach((cartId) => {
            db.query('SELECT c.*, p.price FROM cart c INNER JOIN product p ON c.prod_id = p.prod_id WHERE c.cart_id = ?', [cartId], (err, results) => {
                if (err) throw err;
                if (results.length > 0) {
                    var cartItem = results[0];
                    var qty = req.body['qty_' + cartId] || 1;
                    var price = cartItem.price;
                    var total = price * qty;
                    var point = Math.floor(total * 0.005);

                    var insSql = `INSERT INTO purchase (loginid, prod_id, date, price, point, qty, total, payYN, cancel) VALUES (?, ?, ?, ?, ?, ?, ?, 'Y', 'N')`;
                    db.query(insSql, [loginid, cartItem.prod_id, date, price, point, qty, total], (err2) => {
                        if (err2) throw err2;
                        
                        db.query('DELETE FROM cart WHERE cart_id = ?', [cartId], (err3) => {
                            if (err3) throw err3;
                            completed++;
                            if (completed === cartIds.length) {
                                res.redirect('/purchase');
                            }
                        });
                    });
                }
            });
        });
    },

    // [고객] 장바구니 체크 항목 삭제 (교안 21~22페이지)
    cartdelete_process: (req, res) => {
        var checks = req.body.check;
        if (!checks) {
            return res.send("<script>alert('삭제할 상품을 선택해 주세요'); history.back();</script>");
        }
        var cartIds = Array.isArray(checks) ? checks : [checks];
        
        db.query('DELETE FROM cart WHERE cart_id IN (?)', [cartIds], (err) => {
            if (err) throw err;
            res.redirect('/purchase/cart');
        });
    },

    // [고객] 나의 주문 결과 목록 리스트 (교안 14~16페이지)
    purchase: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var loginid = req.session.loginid;

        if (!req.session.is_logined) {
            return res.send("<script>alert('로그인이 필요합니다.'); location.href='/auth/login';</script>");
        }

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
                categoryList: results[0],
                boardtypes: results[1],
                results: results[2]
            });
        });
    },

    // [고객] 주문 취소 처리 토글 (N -> Y) (교안 16페이지)
    cancel_process: (req, res) => {
        var purchaseId = req.params.purchaseId;
        db.query("UPDATE purchase SET cancel = 'Y' WHERE purchase_id = ?", [purchaseId], (err) => {
            if (err) throw err;
            res.redirect('/purchase');
        });
    },

    // ==========================================================
    // 🛠️ [관리자 권한] 어드민 테이블 총괄 관리 (main.js 다이렉트 매핑 구조)
    // ==========================================================

    // 1. Cart 테이블 총괄 조회 (main.js에서 /cartview 로 연동)
    cartview: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls !== 'MNG' && cls !== 'admin') return res.redirect('/');

        var sql = `
            SELECT * FROM code; SELECT * FROM boardtype;
            SELECT c.cart_id, c.loginid, c.prod_id, c.date, p.name AS user_name, pr.name AS prod_name 
            FROM cart c 
            INNER JOIN person p ON c.loginid = p.loginid
            INNER JOIN product pr ON c.prod_id = pr.prod_id ORDER BY c.date DESC`;

        db.query(sql, (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: 'Cart 테이블 총괄 관리',
                who: name, login: login, cls: cls, body: 'cartView.ejs',
                categoryList: results[0], boardtypes: results[1], results: results[2]
            });
        });
    },

    // 2. Cart 단건 수정 화면 (main.js에서 /cartupdate/:cartId 로 연동)
    cartupdate: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls !== 'MNG' && cls !== 'admin') return res.redirect('/');
        var cartId = req.params.cartId;

        var sql = `
            SELECT * FROM code; SELECT * FROM boardtype;
            SELECT * FROM cart WHERE cart_id = ?;
            SELECT loginid, name FROM person;
            SELECT prod_id, name FROM product`;

        db.query(sql, [cartId], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: 'Cart 정보 수정',
                who: name, login: login, cls: cls, body: 'cartU.ejs',
                categoryList: results[0], boardtypes: results[1],
                cart: results[2][0], persons: results[3], products: results[4]
            });
        });
    },

    // 3. Cart 수정 처리 프로세스 (main.js에서 /cartupdate_process 로 전송)
    cartupdate_process: (req, res) => {
        var b = req.body;
        var sql = 'UPDATE cart SET loginid = ?, prod_id = ?, date = ? WHERE cart_id = ?';
        db.query(sql, [b.loginid, b.prod_id, b.date, b.cart_id], (err) => {
            if (err) throw err;
            res.redirect('/cartview');
        });
    },

    // 4. Cart 단건 삭제 프로세스 (main.js에서 /cartdelete_admin/:cartId 로 연동)
    cartdelete_admin: (req, res) => {
        var cartId = req.params.cartId;
        db.query('DELETE FROM cart WHERE cart_id = ?', [cartId], (err) => {
            if (err) throw err;
            res.redirect('/cartview');
        });
    },

    // 5. Purchase 테이블 총괄 조회 (main.js에서 /purchaseview 로 연동)
    purchaseview: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls !== 'MNG' && cls !== 'admin') return res.redirect('/');

        var sql = `
            SELECT * FROM code; SELECT * FROM boardtype;
            SELECT pc.*, p.name AS user_name, pr.name AS prod_name 
            FROM purchase pc 
            INNER JOIN person p ON pc.loginid = p.loginid
            INNER JOIN product pr ON pc.prod_id = pr.prod_id ORDER BY pc.date DESC`;

        db.query(sql, (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: 'Purchase 테이블 총괄 관리',
                who: name, login: login, cls: cls, body: 'purchaseView.ejs',
                categoryList: results[0], boardtypes: results[1], results: results[2]
            });
        });
    },

    // 6. Purchase 단건 수정 화면 (main.js에서 /purchaseupdate/:purchaseId 로 연동)
    purchaseupdate: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls !== 'MNG' && cls !== 'admin') return res.redirect('/');
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

    // 7. Purchase 수정 처리 프로세스 (main.js에서 /purchaseupdate_process 로 전송)
    purchaseupdate_process: (req, res) => {
        var b = req.body;
        var sql = `
            UPDATE purchase 
            SET loginid = ?, prod_id = ?, price = ?, point = ?, qty = ?, total = ?, payYN = ?, cancel = ? 
            WHERE purchase_id = ?`;
            
        db.query(sql, [b.loginid, b.prod_id, b.price, b.point, b.qty, b.total, b.payYN, b.cancel, b.purchase_id], (err) => {
            if (err) throw err;
            res.redirect('/purchaseview'); 
        });
    }
};