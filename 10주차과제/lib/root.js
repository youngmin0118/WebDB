
const db = require('./db');

function authIsOwner(req, res) {
    var name = 'Guest';
    // [수정] 아이콘 HTML 태그를 넣어야 합니다. 
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
    home: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM product', (error, results) => {
            if (error) throw error;

            var context = {
                title: 'Gachon Shop',
                who: name,
                login: login,
                body: 'product.ejs', // 파일명을 넘겨줌
                cls: cls,
                results: results
            };

            res.render('mainFrame', context, (err, html) => {
                if (err) {
                    // [중요] 에러가 나면 터미널에 찍고 브라우저에도 표시하여 하얀 화면 방지
                    console.error("Rendering Error:", err);
                    res.status(500).send("렌더링 에러 발생: " + err.message);
                } else {
                    res.end(html);
                }
            });
        });
    }
};