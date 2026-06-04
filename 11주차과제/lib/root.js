const db = require('./db');
const auth = require('./auth');

module.exports = {
    home: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        
        // 1. 사이드바용 카테고리(code)와 게시판 종류(boardtype)를 함께 조회합니다.
        // 2. 메인 화면에 보여줄 상품 목록(product)도 함께 가져옵니다.
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product', (err, results) => {
            if (err) throw err;

            const categoryList = results[0]; // code 테이블 데이터
            const boardtypes = results[1];   // boardtype 테이블 데이터
            const products = results[2];     // product 테이블 데이터

            res.render('mainFrame', {
                title: 'Gachon Shop',
                who: name,
                login: login,
                cls: cls,
                categoryList: categoryList, // 사이드바 카테고리 전달
                boardtypes: boardtypes,     // 사이드바 게시판 전달
                results: products,          // 본문 상품 목록 전달
                body: 'product.ejs'         // 메인 본문에 끼워 넣을 파일
            });
        });
    }
};