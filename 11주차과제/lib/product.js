const db = require('./db');

function authIsOwner(req, res) {
    var name = 'Guest';
    var login = '<a href="/auth/login"><i class="bx bx-log-in"></i></a>';
    var cls = 'NON';
    if (req.session.is_logined) {
        name = req.session.name;
        login = '<a href="/auth/logout_process"><i class="bx bx-log-out"></i></a>';
        cls = req.session.cls;
    }
    return { name, login, cls };
}

module.exports = {
    // 1. 전체 상품 보기 (사이드바 카테고리 및 게시판 포함)
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        // 카테고리(code), 게시판(boardtype), 상품(product)을 동시에 조회합니다.
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '상품 관리', 
                who: name, login: login, cls: cls, body: 'product.ejs', 
                categoryList: results[0], // 사이드바용
                boardtypes: results[1],   // 사이드바용
                results: results[2]       // 본문용
            });
        });
    },

    // 2. 카테고리별 상품 필터링 보기
    categoryView: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var main_id = req.params.mainId;
        var sub_id = req.params.subId;
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product WHERE main_id = ? AND sub_id = ?', 
            [main_id, sub_id], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '상품 필터링', 
                who: name, login: login, cls: cls, body: 'product.ejs', 
                categoryList: results[0],
                boardtypes: results[1],
                results: results[2]
            });
        });
    },

    // 3. 상품 등록 화면
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls !== 'admin' && cls !== 'MNG') return res.redirect('/');
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '상품 등록', 
                who: name, login: login, cls: cls, body: 'productCU.ejs', 
                results2: results[0],     // 카테고리 선택용
                categoryList: results[0], // 사이드바용
                boardtypes: results[1]    // 사이드바용
            });
        });
    },

    // 4. 상품 등록 처리
    create_process: (req, res) => {
        var body = req.body;
        var fileName = req.file ? req.file.originalname : '';
        const ids = body.category.split(':');
        const main_id = ids[0];
        const sub_id = ids[1];
        db.query(`INSERT INTO product (main_id, sub_id, name, price, stock, brand, supplier, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [main_id, sub_id, body.name, body.price, body.stock, body.brand, body.supplier, fileName],
            (err, result) => {
                if (err) throw err;
                res.redirect('/product/view');
            }
        );
    },

    // 5. 상품 수정 화면
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls !== 'admin' && cls !== 'MNG') return res.redirect('/');
        var id = req.params.updateId;
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product WHERE prod_id = ?', [id], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '상품 수정', 
                who: name, login: login, cls: cls, body: 'productCU.ejs',
                categoryList: results[0],
                boardtypes: results[1],
                product: results[2][0], 
                results2: results[0]
            });
        });
    },

    // 6. 상품 수정 처리
    update_process: (req, res) => {
        var body = req.body;
        var id = body.prod_id; 
        var fileName = req.file ? req.file.originalname : null;
        const ids = body.category.split(':');
        const main_id = ids[0];
        const sub_id = ids[1];
        let sql, params;
        if (fileName) {
            sql = `UPDATE product SET main_id=?, sub_id=?, name=?, price=?, stock=?, brand=?, supplier=?, image=? WHERE prod_id=?`;
            params = [main_id, sub_id, body.name, body.price, body.stock, body.brand, body.supplier, fileName, id];
        } else {
            sql = `UPDATE product SET main_id=?, sub_id=?, name=?, price=?, stock=?, brand=?, supplier=? WHERE prod_id=?`;
            params = [main_id, sub_id, body.name, body.price, body.stock, body.brand, body.supplier, id];
        }
        db.query(sql, params, (err, result) => {
            if (err) throw err;
            res.redirect('/product/view');
        });
    },

    // 7. 상품 삭제 처리
    delete_process: (req, res) => {
        db.query('DELETE FROM product WHERE prod_id = ?', [req.params.deleteId], (err, result) => {
            if (err) throw err;
            res.redirect('/product/view');
        });
    }
};