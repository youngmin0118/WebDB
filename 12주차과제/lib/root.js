// lib/root.js 완성본
const db = require('./db');
const auth = require('./auth');

module.exports = {
    // 1. 홈 화면 로직 (메인 상품 목록 조회)
    home: (req, res) => {
        let ownerInfo;
        try {
            ownerInfo = auth.authIsOwner(req, res);
        } catch (authErr) {
            console.error("❌ auth.authIsOwner 실행 중 에러 발생:", authErr);
            return res.status(500).send("인증 모듈 에러 발생");
        }

        const { name, login, cls } = ownerInfo;
        
        // 사이드바 카테고리, 게시판 종류, 메인 상품 목록 멀티 쿼리
        const sql = 'SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM product';
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error("❌ [MySQL DB 에러] 홈 화면 쿼리 실패:", err.message);
                return res.status(500).send("DB 쿼리 에러 발생");
            }

            const categoryList = (results && results[0]) ? results[0] : [];
            const boardtypes = (results && results[1]) ? results[1] : [];
            const products = (results && results[2]) ? results[2] : [];

            res.render('mainFrame', {
                title: 'Gachon Shop',
                who: name,
                login: login,
                cls: cls,
                categoryList: categoryList, 
                boardtypes: boardtypes,     
                results: products,          
                body: 'product.ejs'         
            });
        });
    },

    // 2. 🔍 검색 화면 로직 (교안 5~6페이지 반영)
    search: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        const keyword = req.body.search; // 사용자가 입력한 검색어 [cite: 99]

        // 교안 5페이지 조건: 상품명, 브랜드, 공급업체 기준 키워드 검색 SQL [cite: 97, 98, 99]
        const sql = `
            SELECT * FROM code; 
            SELECT * FROM boardtype; 
            SELECT * FROM product 
            WHERE name LIKE ? OR brand LIKE ? OR supplier LIKE ?;
        `;
        
        const queryKeyword = `%${keyword}%`; // [cite: 99]

        db.query(sql, [queryKeyword, queryKeyword, queryKeyword], (err, results) => {
            if (err) {
                console.error("❌ [MySQL DB 에러] 검색 쿼리 실패:", err.message);
                return res.status(500).send("검색 중 에러가 발생했습니다.");
            }

            const categoryList = (results && results[0]) ? results[0] : [];
            const boardtypes = (results && results[1]) ? results[1] : [];
            const searchedProducts = (results && results[2]) ? results[2] : [];

            // 검색 완료 후 동일하게 mainFrame과 product.ejs를 이용해 결과를 보여줌 [cite: 96]
            res.render('mainFrame', {
                title: 'Gachon Shop - 검색 결과',
                who: name,
                login: login,
                cls: cls,
                categoryList: categoryList,
                boardtypes: boardtypes,
                results: searchedProducts, // 검색된 상품 목록만 전달
                body: 'product.ejs'
            });
        });
    }
};