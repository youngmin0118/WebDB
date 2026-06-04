const db = require('./db'); 

// 세션 정보를 확인하여 사용자 정보를 반환하는 함수
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
    // 1. 상품 목록 조회
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM product', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', { 
                title: '상품 관리',
                who: name,
                login: login,
                cls: cls, // views/product.ejs에서 사용하기 위해 전달 
                body: 'product.ejs', 
                results: results 
            });
        });
    },

    // 2. 상품 입력 화면 (관리자 전용)
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        // 관리자가 아니면 홈으로 리다이렉트
        if (cls !== 'admin') return res.redirect('/'); 

        db.query('SELECT * FROM code', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', { 
                title: '상품 등록',
                who: name,
                login: login,
                cls: cls,
                body: 'productCU.ejs', 
                results2: results 
            });
        });
    },

    // 3. 상품 입력 처리
    create_process: (req, res) => {
        var { cls } = authIsOwner(req, res);
        if (cls !== 'admin') return res.status(403).send("권한이 없습니다.");

        let body = req.body;
        let fileName = req.file ? req.file.originalname : '';
        db.query(`INSERT INTO product (category, name, price, stock, brand, supplier, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [body.category, body.name, body.price, body.stock, body.brand, body.supplier, fileName], 
            (err, result) => {
                if (err) throw err;
                res.redirect('/product/view');
            }
        );
    },

    // 4. 상품 수정 화면 (관리자 전용)
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        if (cls !== 'admin') return res.redirect('/');

        let id = req.params.updateId;
        db.query('SELECT * FROM product WHERE id = ?', [id], (err, productResult) => {
            if (err) throw err;
            db.query('SELECT * FROM code', (err, codeResult) => {
                if (err) throw err;
                res.render('mainFrame', {
                    title: '상품 수정',
                    who: name,
                    login: login,
                    cls: cls,
                    body: 'productCU.ejs',
                    product: productResult[0],
                    results2: codeResult
                });
            });
        });
    },

    // 5. 상품 수정 처리
    update_process: (req, res) => {
        var { cls } = authIsOwner(req, res);
        if (cls !== 'admin') return res.status(403).send("권한이 없습니다.");

        let body = req.body;
        let id = body.id;
        let fileName = req.file ? req.file.originalname : null;
        
        let sql = fileName 
            ? `UPDATE product SET category=?, name=?, price=?, stock=?, brand=?, supplier=?, image=? WHERE id=?`
            : `UPDATE product SET category=?, name=?, price=?, stock=?, brand=?, supplier=? WHERE id=?`;
        let params = fileName 
            ? [body.category, body.name, body.price, body.stock, body.brand, body.supplier, fileName, id]
            : [body.category, body.name, body.price, body.stock, body.brand, body.supplier, id];

        db.query(sql, params, (err, result) => {
            if (err) throw err;
            res.redirect('/product/view');
        });
    },

    // 6. 상품 삭제 처리 (관리자 전용)
    delete_process: (req, res) => {
        var { cls } = authIsOwner(req, res);
        if (cls !== 'admin') return res.status(403).send("권한이 없습니다.");

        let id = req.params.deleteId;
        db.query('DELETE FROM product WHERE id = ?', [id], (err, result) => {
            if (err) throw err;
            res.redirect('/product/view');
        });
    }
};