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
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        db.query('SELECT * FROM code', (error, results) => {
            if (error) throw error;
            var context = {
                title: 'Code 관리', who: name, login: login, body: 'code.ejs', cls: cls, results: results
            };
            res.render('mainFrame', context);
        });
    },

    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req, res);
        var context = {
            title: 'Code 생성', who: name, login: login, body: 'codeCU.ejs', cls: cls
        };
        res.render('mainFrame', context);
    },

    create_process: (req, res) => {
        var post = req.body;
        db.query(`INSERT INTO code (main_id, sub_id, main_name, sub_name, start, end) VALUES(?, ?, ?, ?, ?, ?)`,
            [post.main_id, post.sub_id, post.main_name, post.sub_name, post.start, post.end],
            (error, result) => {
                if (error) throw error;
                res.redirect('/code/view');
            }
        );
    },

    update: (req, res) => {
        const { name, login, cls } = authIsOwner(req, res); 
        const { main, sub, start, end } = req.params; 
        
        db.query('SELECT * FROM code WHERE main_id=? AND sub_id=? AND start=? AND end=?', 
            [main, sub, start, end], (error, result) => {
            if (error) throw error;
            
            var context = {
                title: 'Code 수정', who: name, login: login, cls: cls, body: 'codeCU.ejs', 
                code: result[0]    
            };
            res.render('mainFrame', context);
        });
    },

   // 새로운 시작일(start)을 저장하고, 기존 시작일(old_start)로 대상을 찾습니다.
    update_process: (req, res) => {
        var post = req.body;
        db.query(`UPDATE code SET main_name=?, sub_name=?, start=?, end=? WHERE main_id=? AND sub_id=? AND start=?`,
            [post.main_name, post.sub_name, post.start, post.end, post.main_id, post.sub_id, post.old_start],
            (error, result) => {
                if (error) {
                    console.error("코드 수정 중 에러 발생:", error);
                    return res.status(500).send("데이터베이스 수정 오류가 발생했습니다.");
                }
                res.redirect('/code/view');
            }
        );
    },

    delete_process: (req, res) => {
        var { main, sub, start, end } = req.params;
        db.query('DELETE FROM code WHERE main_id=? AND sub_id=? AND start=? AND end=?', 
            [main, sub, start, end], (error, result) => {
                if (error) throw error;
                res.redirect('/code/view');
        });
    }
};