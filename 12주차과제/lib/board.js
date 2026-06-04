const db = require('./db');
const auth = require('./auth');
const { authIsOwner } = require('./auth');

module.exports = {
    // 1. 게시판 종류 관리 목록
    typeview: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        if (cls !== 'MNG' && cls !== 'CEO') return res.send("<script>alert('관리자 권한이 필요합니다.'); location.href='/';</script>");
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '게시판 종류 관리', body: 'boardtype.ejs', who: name, login: login, cls: cls,
                results: results[1],      
                boardtypes: results[1],   
                categoryList: results[0]  
            });
        });
    },

    // 2. 게시판 종류 생성 화면
    typecreate: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '게시판 생성', body: 'boardtypeCU.ejs', who: name, login: login, cls: cls,
                categoryList: results[0],
                boardtypes: results[1],
                results: [{}], mode: 'create'
            });
        });
    },

    typecreate_process: (req, res) => {
        const post = req.body;
        db.query('INSERT INTO boardtype (title, description, write_YN, re_YN, numPerPage) VALUES(?,?,?,?,?)',
            [post.title, post.description, post.write_YN, post.re_YN, post.numPerPage], (err) => {
                if (err) throw err;
                res.redirect('/board/type/view');
            });
    },

    // 3. 게시판 종류 수정 화면
    typeupdate: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        const typeId = req.params.typeId;
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM boardtype WHERE type_id = ?', [typeId], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '게시판 수정', body: 'boardtypeCU.ejs', who: name, login: login, cls: cls,
                categoryList: results[0],
                boardtypes: results[1],
                boardtype: results[2][0], mode: 'update'
            });
        });
    },

    typeupdate_process: (req, res) => {
        const post = req.body;
        db.query('UPDATE boardtype SET title=?, description=?, write_YN=?, re_YN=?, numPerPage=? WHERE type_id=?',
            [post.title, post.description, post.write_YN, post.re_YN, post.numPerPage, post.type_id], (err) => {
                if (err) throw err;
                res.redirect('/board/type/view');
            });
    },

    typedelete_process: (req, res) => {
        const typeId = req.params.typeId;
        db.query('DELETE FROM boardtype WHERE type_id = ?', [typeId], (err) => {
            if (err) throw err;
            res.redirect('/board/type/view');
        });
    },

    // 4. 게시글 목록 보기 (페이징 포함)
    view: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        const typeId = req.params.typeId;
        const pNum = Number(req.params.pNum) || 1;

        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM boardtype WHERE type_id = ?; SELECT count(*) as total FROM board WHERE type_id = ?', 
        [typeId, typeId], (error, results) => {
            if (error) throw error;
            const categoryList = results[0];
            const boardtypes = results[1];
            const btname = results[2][0];
            const numPerPage = btname.numPerPage || 10;
            const offset = (pNum - 1) * numPerPage;
            const totalPages = Math.ceil(results[3][0].total / numPerPage);

            db.query(`SELECT b.*, p.name AS author_name FROM board b 
                      LEFT JOIN person p ON b.loginid = p.loginid 
                      WHERE b.type_id = ? ORDER BY date DESC, board_id DESC LIMIT ? OFFSET ?`,
                [typeId, numPerPage, offset], (err, boards) => {
                    res.render('mainFrame', {
                        title: btname.title, body: 'board.ejs', who: name, login: login, cls: cls,
                        who_id: req.session.loginid, boardtypes: boardtypes, categoryList: categoryList,
                        btname: [btname], results: boards, pNum: pNum, totalPages: totalPages, typeId: typeId
                    });
                }
            );
        });
    },

    // 5. 게시글 생성 화면
    create: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        const typeId = req.params.typeId;
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM boardtype WHERE type_id = ?', [typeId], (err, results) => {
            const btname = results[2][0];

            // 게시판 이름이 '공지사항'인 경우, 오직 MNG 권한만 글쓰기 진입 허용
            if (btname.title === '공지사항') {
                if (cls !== 'MNG') {
                    return res.send("<script>alert('공지사항은 관리자(MNG)만 작성할 수 있습니다.'); history.back();</script>");
                }
            } else {
                // 일반 게시판인 경우 기존 권한 규칙(MNG, CEO 혹은 일반쓰기 가능여부) 적용
                if (cls !== 'MNG' && cls !== 'CEO' && btname.write_YN !== 'Y') {
                    return res.send("<script>alert('권한이 없습니다.'); history.back();</script>");
                }
            }

            res.render('mainFrame', {
                title: '글쓰기', body: 'boardCU.ejs', who: name, login: login, cls: cls,
                categoryList: results[0], boardtypes: results[1], typeId: typeId, btname: results[2], results: [{}], mode: 'create'
            });
        });
    },

    create_process: (req, res) => {
        const post = req.body;
        const loginid = req.session.loginid; 
        const cls = req.session.cls;

        if (cls === 'MNG') {
            db.query('SELECT password FROM person WHERE loginid = ?', [loginid], (err, results) => {
                const userPassword = (results.length > 0) ? results[0].password : '';
                db.query(`INSERT INTO board (type_id, loginid, title, content, date, password) VALUES(?, ?, ?, ?, NOW(), ?)`,
                    [post.type_id, loginid, post.title, post.content, userPassword], (err2) => {
                        if (err2) throw err2;
                        res.redirect(`/board/view/${post.type_id}/1`);
                    });
            });
        } else {
            db.query('SELECT password FROM person WHERE loginid = ?', [loginid], (err, results) => {
                if (err) throw err;
                if (results.length > 0 && post.password === results[0].password) {
                    db.query(`INSERT INTO board (type_id, loginid, title, content, date, password) VALUES(?, ?, ?, ?, NOW(), ?)`,
                        [post.type_id, loginid, post.title, post.content, results[0].password], (err2) => {
                            if (err2) throw err2;
                            res.redirect(`/board/view/${post.type_id}/1`);
                        });
                } else {
                    res.send("<script>alert('비밀번호가 틀렸습니다.'); history.back();</script>");
                }
            });
        }
    },

    // 6. 게시글 상세 및 수정/삭제
    detail: (req, res) => {
        const { name, login, cls } = authIsOwner(req, res);
        const { boardId, pNum } = req.params;
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, sidebarData) => {
            db.query(`SELECT b.*, p.name AS author_name FROM board b LEFT JOIN person p ON b.loginid = p.loginid WHERE b.board_id = ?`, 
            [boardId], (err2, result) => {
                res.render('mainFrame', {
                    title: '상세보기', body: 'boardDetail.ejs', who: name, login: login, cls: cls,
                    categoryList: sidebarData[0], boardtypes: sidebarData[1], results: result, pNum: pNum
                });
            });
        });
    },

    update: (req, res) => {
        const { name, login, cls } = authIsOwner(req, res);
        const { boardId, typeId, pNum } = req.params;
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, sidebarData) => {
            db.query(`SELECT b.*, p.name AS author_name FROM board b LEFT JOIN person p ON b.loginid = p.loginid WHERE b.board_id = ?`, 
            [boardId], (err2, results) => {
                res.render('mainFrame', {
                    title: '수정하기', body: 'boardCU.ejs', who: name, login: login, cls: cls,
                    categoryList: sidebarData[0], boardtypes: sidebarData[1], results: results, typeId: typeId, pNum: pNum, mode: 'update'
                });
            });
        });
    },

    update_process: (req, res) => {
        const post = req.body;
        const loginid = req.session.loginid;
        const cls = req.session.cls;

        if (cls === 'MNG') {
            db.query(`UPDATE board SET title=?, content=? WHERE board_id=?`, 
                [post.title, post.content, post.board_id], (err) => {
                    if (err) throw err;
                    res.redirect(`/board/view/${post.type_id}/1`);
                });
        } else {
            db.query('SELECT password FROM person WHERE loginid = ?', [loginid], (err, result) => {
                if (err) throw err;
                if (result.length > 0 && post.password === result[0].password) {
                    db.query(`UPDATE board SET title=?, content=? WHERE board_id=?`, 
                        [post.title, post.content, post.board_id], (err2) => {
                            if (err2) throw err2;
                            res.redirect(`/board/view/${post.type_id}/1`);
                        });
                } else {
                    res.send("<script>alert('로그인 비밀번호가 일치하지 않습니다.'); history.back();</script>");
                }
            });
        }
    },

    delete_process: (req, res) => {
        const { boardId, typeId, pNum } = req.params;
        db.query('DELETE FROM board WHERE board_id = ?', [boardId], (err) => {
            if (err) throw err;
            res.redirect(`/board/view/${typeId}/${pNum}`);
        });
    }
};