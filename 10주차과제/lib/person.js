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
    // 1. 회원 목록 조회
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM person', (error, results) => {
            if (error) throw error;
            var context = {
                title: '회원 관리',
                who: name, login: login, body: 'person.ejs', cls: cls,
                results: results
            };
            res.render('mainFrame', context, (err, html) => { res.end(html); });
        });
    },

    // 2. 회원 생성 화면
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var context = {
            title: '회원 생성',
            who: name, login: login, body: 'personCU.ejs', cls: cls
        };
        res.render('mainFrame', context, (err, html) => { res.end(html); });
    },

    create_process: (req, res) => {
        var post = req.body;
        db.query(`INSERT INTO person (loginid, password, name, mf, address, tel, birth, class) 
                  VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
            [post.loginid, post.password, post.name, post.mf, post.address, post.tel, post.birth, post.class],
            (error, result) => {
                if (error) throw error;
                res.redirect('/person/view');
            }
        );
    },

    // 3. 회원 정보 수정 화면
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var loginId = req.params.loginId;
        db.query('SELECT * FROM person WHERE loginid = ?', [loginId], (error, result) => {
            if (error) throw error;
            var context = {
                title: '회원 수정',
                who: name, login: login, body: 'personCU.ejs', cls: cls,
                person: result[0]
            };
            res.render('mainFrame', context, (err, html) => { res.end(html); });
        });
    },

    update_process: (req, res) => {
        var post = req.body;
        db.query(`UPDATE person SET password=?, name=?, mf=?, address=?, tel=?, birth=?, class=? 
                  WHERE loginid=?`,
            [post.password, post.name, post.mf, post.address, post.tel, post.birth, post.class, post.loginid],
            (error, result) => {
                if (error) throw error;
                res.redirect('/person/view');
            }
        );
    },

    // 4. 회원 삭제 처리
    delete_process: (req, res) => {
        var loginId = req.params.loginId;
        db.query('DELETE FROM person WHERE loginid = ?', [loginId], (error, result) => {
            if (error) throw error;
            res.redirect('/person/view');
        });
    }
};