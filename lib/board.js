const db = require('./db');
const auth = require('./auth');
const { authIsOwner } = require('./auth');

module.exports = {
    // =====================================================================
    // 📁 [1] 게시판 종류(Board Type) 관리 (관리자/경영자 전용)
    // =====================================================================

    /**
     * [게시판 종류 목록 조회]
     * 목적: 현재 생성된 게시판(Q&A, 공지사항 등) 목록을 관리자에게 보여줍니다.
     */
    typeview: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        // 권한 체크: 관리자(MNG)나 경영자(CEO)가 아니면 메인 화면으로 튕겨냄
        if (cls !== 'MNG' && cls !== 'CEO') return res.send("<script>alert('관리자 권한이 필요합니다.'); location.href='/';</script>");
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '게시판 종류 관리', body: 'boardtype.ejs', who: name, login: login, cls: cls,
                results: results[1],      // 화면 중앙 테이블에 그릴 게시판 종류 목록
                boardtypes: results[1],   // 좌측 사이드바에 그릴 게시판 목록
                categoryList: results[0]  // 좌측 사이드바에 그릴 카테고리 목록
            });
        });
    },

    /**
     * [게시판 종류 생성 화면]
     * 목적: 새로운 게시판을 만들기 위한 폼(Form) 화면을 띄워줍니다.
     */
    typecreate: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '게시판 생성', body: 'boardtypeCU.ejs', who: name, login: login, cls: cls,
                categoryList: results[0], boardtypes: results[1], 
                results: [{}], mode: 'create' // mode를 'create'로 넘겨서 EJS가 생성 폼으로 작동하게 함
            });
        });
    },

    /**
     * [게시판 종류 생성 처리]
     * 목적: 폼에서 입력받은 데이터를 실제 DB의 boardtype 테이블에 INSERT 합니다.
     */
    typecreate_process: (req, res) => {
        const post = req.body;
        db.query('INSERT INTO boardtype (title, description, write_YN, re_YN, numPerPage) VALUES(?,?,?,?,?)',
            [post.title, post.description, post.write_YN, post.re_YN, post.numPerPage], (err) => {
                if (err) throw err;
                res.redirect('/board/type/view'); // 생성 완료 후 목록 화면으로 이동
            });
    },

    /**
     * [게시판 종류 수정 화면]
     */
    typeupdate: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        const typeId = req.params.typeId; // URL에서 수정할 게시판의 ID를 가져옴
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM boardtype WHERE type_id = ?', [typeId], (err, results) => {
            if (err) throw err;
            res.render('mainFrame', {
                title: '게시판 수정', body: 'boardtypeCU.ejs', who: name, login: login, cls: cls,
                categoryList: results[0], boardtypes: results[1], 
                boardtype: results[2][0], mode: 'update' // mode를 'update'로 넘겨서 EJS가 기존 값을 채운 수정 폼으로 작동하게 함
            });
        });
    },

    /**
     * [게시판 종류 수정 처리]
     */
    typeupdate_process: (req, res) => {
        const post = req.body;
        db.query('UPDATE boardtype SET title=?, description=?, write_YN=?, re_YN=?, numPerPage=? WHERE type_id=?',
            [post.title, post.description, post.write_YN, post.re_YN, post.numPerPage, post.type_id], (err) => {
                if (err) throw err;
                res.redirect('/board/type/view');
            });
    },

    /**
     * [게시판 종류 삭제 처리]
     */
    typedelete_process: (req, res) => {
        const typeId = req.params.typeId;
        db.query('DELETE FROM boardtype WHERE type_id = ?', [typeId], (err) => {
            if (err) throw err;
            res.redirect('/board/type/view');
        });
    },

    // =====================================================================
    // 📝 [2] 특정 게시판 내부의 게시글(Post) CRUD 관리
    // =====================================================================

    /**
     * [게시글 목록 보기 (페이징 적용)]
     * 목적: 특정 게시판(typeId)에 속한 글들을 페이지 번호(pNum)에 맞춰 잘라서 보여줍니다.
     */
    view: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        const typeId = req.params.typeId;
        const pNum = Number(req.params.pNum) || 1; // 페이지 번호가 없으면 기본값 1페이지로 설정

        // 1. 필요한 메타데이터(사이드바, 현재 게시판 정보, 총 게시글 수)를 다중 쿼리로 가져옴
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM boardtype WHERE type_id = ?; SELECT count(*) as total FROM board WHERE type_id = ?', 
        [typeId, typeId], (error, results) => {
            if (error) throw error;
            
            const categoryList = results[0];
            const boardtypes = results[1];
            const btname = results[2][0]; // 현재 진입한 게시판의 설정 정보 (ex: 페이지당 글 수)
            
            // 💡 [페이징(Pagination) 수학 로직]
            const numPerPage = btname.numPerPage || 10; // 1페이지당 보여줄 글의 갯수 (설정값이 없으면 10개)
            const offset = (pNum - 1) * numPerPage;     // DB에서 건너뛸 글의 갯수 (예: 2페이지면 앞의 10개를 건너뜀)
            const totalPages = Math.ceil(results[3][0].total / numPerPage); // 전체 글 수를 바탕으로 총 페이지 수 계산 (올림 처리)

            // 💡 [게시글 정렬 및 추출 로직]
            // ORDER BY p_id DESC, board_id ASC
            // -> 1차 정렬: 부모 번호(p_id)를 최신순(내림차순)으로 정렬하여 새 글이 위로 오게 함.
            // -> 2차 정렬: 같은 p_id(원글과 답글) 그룹 내에서는 고유번호(board_id) 오름차순으로 정렬하여 원글 바로 밑에 답글이 붙게 함.
            // LIMIT ? OFFSET ? -> 계산해둔 갯수만큼만 데이터를 잘라서 가져옴.
            db.query(`SELECT b.*, p.name AS author_name FROM board b 
                      LEFT JOIN person p ON b.loginid = p.loginid 
                      WHERE b.type_id = ? ORDER BY p_id DESC, board_id ASC LIMIT ? OFFSET ?`,
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

    /**
     * [게시글 작성 화면]
     * 목적: 글쓰기 권한을 체크하고 폼 화면을 띄워줍니다.
     */
    create: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        const typeId = req.params.typeId;
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM boardtype WHERE type_id = ?', [typeId], (err, results) => {
            const btname = results[2][0]; // 현재 게시판의 권한 설정 정보

            // 💡 [글쓰기 방어(Access Control) 로직]
            if (btname.title === '공지사항' && cls !== 'MNG') {
                return res.send("<script>alert('공지사항은 관리자(MNG)만 작성할 수 있습니다.'); history.back();</script>");
            } else if (cls !== 'MNG' && cls !== 'CEO' && btname.write_YN !== 'Y') {
                return res.send("<script>alert('권한이 없습니다.'); history.back();</script>");
            }

            res.render('mainFrame', {
                title: '글쓰기', body: 'boardCU.ejs', who: name, login: login, cls: cls,
                categoryList: results[0], boardtypes: results[1], typeId: typeId, btname: results[2], results: [{}], mode: 'create'
            });
        });
    },

    /**
     * [게시글 작성 처리]
     * 목적: 폼 데이터를 DB에 넣습니다. (원글 등록 시 p_id를 자기 자신의 ID로 업데이트하는 특수 로직 포함)
     */
    create_process: (req, res) => {
        const post = req.body;
        const loginid = req.session.loginid; 
        const cls = req.session.cls;

        // 중복되는 DB INSERT 로직을 묶어둔 헬퍼 함수
        const checkPwdAndInsert = (pwdToSave) => {
            // 💡 [원글-답글 그룹핑(p_id) 1단계]: 새 글(원글)을 쓸 때는 임시로 p_id를 0으로 넣고 글을 먼저 생성합니다.
            db.query(`INSERT INTO board (type_id, p_id, loginid, password, title, date, content) VALUES(?, 0, ?, ?, ?, NOW(), ?)`,
                [post.type_id, loginid, pwdToSave, post.title, post.content], (err, result) => {
                    if (err) throw err;
                    
                    // 💡 [원글-답글 그룹핑 2단계]: 글이 생성되면서 발급된 고유 번호(result.insertId)를 자신의 p_id(부모 번호)로 덮어씌웁니다.
                    // 이렇게 하면 원글은 자기 자신의 번호를 그룹 번호로 가지게 됩니다.
                    db.query('UPDATE board SET p_id = ? WHERE board_id = ?', [result.insertId, result.insertId], (err2) => {
                        if (err2) throw err2;
                        res.redirect(`/board/view/${post.type_id}/1`); // 등록 완료 후 해당 게시판 1페이지로 이동
                    });
                });
        };

        // 관리자는 비밀번호 검증 없이 통과, 일반 유저는 폼에서 입력한 비밀번호와 DB 비밀번호 일치 여부 검증
        if (cls === 'MNG') {
            db.query('SELECT password FROM person WHERE loginid = ?', [loginid], (err, results) => {
                checkPwdAndInsert((results.length > 0) ? results[0].password : '');
            });
        } else {
            db.query('SELECT password FROM person WHERE loginid = ?', [loginid], (err, results) => {
                if (err) throw err;
                // 입력한 비밀번호(post.password)와 DB의 비밀번호(results[0].password) 비교
                if (results.length > 0 && post.password === results[0].password) {
                    checkPwdAndInsert(results[0].password);
                } else {
                    res.send("<script>alert('비밀번호가 틀렸습니다.'); history.back();</script>");
                }
            });
        }
    },

    /**
     * [게시글 상세 화면]
     */
    detail: (req, res) => {
        const { name, login, cls } = authIsOwner(req, res);
        const { boardId, pNum } = req.params;
        
        db.query('SELECT * FROM code; SELECT * FROM boardtype', (err, sidebarData) => {
            // 💡 게시판 종류(t.re_YN) 정보도 함께 JOIN해서 가져옴 (답변 버튼을 노출할지 말지 결정하기 위해)
            db.query(`SELECT b.*, p.name AS author_name, t.re_YN, t.type_id 
                      FROM board b 
                      LEFT JOIN person p ON b.loginid = p.loginid 
                      LEFT JOIN boardtype t ON b.type_id = t.type_id
                      WHERE b.board_id = ?`, 
            [boardId], (err2, result) => {
                
                // 💡 [답변 여부 체크 로직]: 원글(p_id)과 같은 그룹에 속해 있으면서 자기 자신(board_id)이 아닌 다른 글(=답변글)이 존재하는지 카운트합니다.
                db.query(`SELECT count(*) as count FROM board WHERE p_id = ? AND board_id != ?`, [result[0].p_id, result[0].p_id], (err3, replyCheck) => {
                    // 결과가 0보다 크면 이미 답변이 달렸다는 뜻 (true/false 저장)
                    result[0].hasReply = replyCheck[0].count > 0;
                    
                    res.render('mainFrame', {
                        title: '상세보기', body: 'boardDetail.ejs', who: name, login: login, cls: cls,
                        categoryList: sidebarData[0], boardtypes: sidebarData[1], results: result, pNum: pNum
                    });
                });
            });
        });
    },

    /**
     * [게시글 수정 화면 및 처리 로직들]
     * (동작 방식은 글쓰기 로직과 동일하며, UPDATE 쿼리를 수행합니다.)
     */
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

    /**
     * [게시글 삭제 처리]
     * 목적: 특정 게시글을 삭제합니다. 원글을 삭제할 경우 그 밑에 달린 답변도 같이 지워지도록 p_id를 이용합니다.
     */
    delete_process: (req, res) => {
        const { boardId, typeId, pNum } = req.params;
        // 삭제하려는 글의 그룹번호(p_id)를 먼저 알아냄
        db.query('SELECT p_id FROM board WHERE board_id = ?', [boardId], (err, result) => {
            if(result.length > 0) {
                // 같은 그룹번호(p_id)를 가진 모든 글(원글+답변글 모두)을 데이터베이스에서 한 번에 삭제
                db.query('DELETE FROM board WHERE p_id = ?', [result[0].p_id], (err2) => {
                    res.redirect(`/board/view/${typeId}/${pNum}`);
                });
            } else {
                res.redirect(`/board/view/${typeId}/${pNum}`);
            }
        });
    },

    // =====================================================================
    // ✍️ [3] 관리자 답글(Reply) 기능 관리
    // =====================================================================

    /**
     * [답글 작성 폼 화면 띄우기]
     */
    reply: (req, res) => {
        const { name, login, cls } = auth.authIsOwner(req, res);
        const { boardId, typeId, pNum } = req.params; // boardId는 답변을 달 대상인 '원글의 ID'입니다.
        
        // 방어 코드: 관리자(MNG)가 아니면 접근 차단
        if (cls !== 'MNG') {
            return res.send("<script>alert('답변은 관리자만 작성할 수 있습니다.'); history.back();</script>");
        }

        // 원글의 정보(기존 제목 등)를 가져오기 위해 DB 조회
        db.query('SELECT * FROM code; SELECT * FROM boardtype; SELECT * FROM board WHERE board_id = ?', [boardId], (err, results) => {
            if (err) throw err;
            
            // 💡 [답글 맞춤형 데이터 세팅]
            let replyData = results[2][0]; // 원글의 데이터 복사
            replyData.title = `[답변] : ${replyData.title}`; // 교재 조건에 맞춰 제목을 "[답변] : 기존 제목" 형태로 강제 변경
            replyData.content = ""; // 답변 내용은 관리자가 새로 써야 하므로 빈칸으로 초기화

            res.render('mainFrame', {
                title: '답변 달기', body: 'boardCU.ejs', who: name, login: login, cls: cls,
                categoryList: results[0], boardtypes: results[1], typeId: typeId, 
                results: [replyData], pNum: pNum, 
                mode: 'reply' // 모드를 'reply'로 지정하여 EJS에서 일반 글쓰기나 수정이 아닌 답변 모드로 동작하도록 함
            });
        });
    },

    /**
     * [답글 실제 등록 처리]
     * 목적: 관리자가 작성한 답변 데이터를 DB에 넣을 때, p_id에 '원글의 번호'를 매핑해줍니다.
     */
    reply_process: (req, res) => {
        const post = req.body;
        const loginid = req.session.loginid; 
        
        db.query('SELECT password FROM person WHERE loginid = ?', [loginid], (err, results) => {
            const userPassword = (results.length > 0) ? results[0].password : '';
            
            // 💡 [답변 DB Insert의 핵심 로직]
            // 일반 글쓰기와 달리 p_id 자리에 0이 아니라 post.board_id(답글 폼에서 넘어온 원글의 번호)를 명시적으로 집어넣습니다.
            // 이렇게 하면 DB 조회 시 이 답글이 해당 원글 밑으로 착 달라붙게 정렬됩니다.
            db.query(`INSERT INTO board (type_id, p_id, loginid, password, title, date, content) VALUES(?, ?, ?, ?, ?, NOW(), ?)`,
                [post.type_id, post.board_id, loginid, userPassword, post.title, post.content], (err2) => {
                    if (err2) throw err2;
                    res.redirect(`/board/view/${post.type_id}/1`); // 답글 등록 완료 후 게시판 목록(1페이지)으로 돌아감
                });
        });
    }
};