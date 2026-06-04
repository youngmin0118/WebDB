// router/boardRouter.js (게시판 관련 길잡이 라우터)

// 1. Express 모듈 및 라우터 객체 가져오기
const express = require('express');
const router = express.Router(); // 사용자의 접속 경로를 목적지로 안내해 줄 길잡이(라우터) 생성

// 2. 실제 게시판 로직(데이터 처리)이 담긴 컨트롤러 파일 불러오기
const board = require('../lib/board'); 

// ==============================================================================
// 💡 알림: 메인 서버(main.js)에서 app.use('/board', boardRouter)라고 설정했기 때문에,
// 이곳에 적는 모든 주소들은 자동으로 맨 앞에 '/board'가 기본으로 붙게 됩니다.
// ==============================================================================


// ==============================================================================
// 📁 [1] 게시판 종류(Board Type) 관리 라우터 (관리자용)
// ==============================================================================

// 게시판 종류 목록 화면 (실제 주소: /board/type/view)
router.get('/type/view', board.typeview);

// 게시판 종류 생성 폼 화면 
router.get('/type/create', board.typecreate);

// 게시판 종류 생성 데이터 처리 (폼에서 안전하게 숨겨서 넘어오므로 POST 사용)
router.post('/type/create_process', board.typecreate_process);

// 게시판 종류 수정 폼 화면
// 💡 ':typeId' 부분은 변수(파라미터)입니다! 어떤 게시판을 수정할지 URL을 통해 아이디를 전달받습니다.
router.get('/type/update/:typeId', board.typeupdate);

// 게시판 종류 수정 데이터 처리 
router.post('/type/update_process', board.typeupdate_process);

// 게시판 종류 삭제 처리 (클릭 시 해당 id의 게시판을 삭제)
router.get('/type/delete/:typeId', board.typedelete_process);


// ==============================================================================
// 📝 [2] 게시판 내부 게시글(Post) 관리 라우터
// ==============================================================================

// 특정 게시판의 게시글 목록 보기 
// 💡 ':typeId'는 게시판 종류(Q&A, 공지사항 등), ':pNum'은 페이지 번호(1페이지, 2페이지 등)입니다.
// 실제 주소 예시: /board/view/1/2 (1번 게시판의 2페이지를 보여줘!)
router.get('/view/:typeId/:pNum', board.view);

// 특정 게시판에 새 글 쓰기 폼 화면 
router.get('/create/:typeId', board.create);

// 새 글 쓰기 데이터 DB 저장 처리
router.post('/create_process', board.create_process);

// 특정 게시글 상세 보기 화면 
// 💡 ':boardId'는 읽으려는 글 번호, ':pNum'은 목록으로 돌아갈 때 원래 있던 페이지로 가기 위한 번호입니다.
router.get('/detail/:boardId/:pNum', board.detail);

// 특정 게시글 수정 폼 화면 
router.get('/update/:boardId/:typeId/:pNum', board.update);

// 특정 게시글 수정 데이터 DB 업데이트 처리
router.post('/update_process', board.update_process);

// 특정 게시글 삭제 처리
router.get('/delete/:boardId/:typeId/:pNum', board.delete_process);


// ==============================================================================
// ✍️ [3] 관리자 답글(Reply) 관련 추가 라우터 (13주차 핵심)
// ==============================================================================

// 답글 쓰기 폼 화면 
// 💡 어떤 글(boardId)에 답글을 달지, 게시판 종류(typeId)와 페이지(pNum) 정보까지 함께 가져갑니다.
router.get('/reply/:boardId/:typeId/:pNum', board.reply);

// 답글 데이터 DB 저장 처리 (원글 밑에 착 달라붙도록 p_id를 이용해 처리됨)
router.post('/reply_process', board.reply_process);


// 3. 모듈 내보내기 (이 길잡이를 메인 서버가 쓸 수 있도록 허용)
module.exports = router;