// router/purchaseRouter.js (구매 및 장바구니 관련 길잡이 라우터)

// 1. 필요한 외부 모듈 가져오기
const express = require('express');
const router = express.Router(); // 접속 경로를 목적지로 안내해 줄 길잡이(라우터) 객체 생성
const purchase = require('../lib/purchase'); // 실제 데이터베이스 처리 로직이 담긴 파일 연결

// ==============================================================================
// 💡 알림: 메인 서버(main.js)에서 app.use('/purchase', purchaseRouter)라고 설정했다면,
// 이곳에 적는 모든 주소들은 자동으로 맨 앞에 '/purchase'가 기본으로 붙게 됩니다.
// ==============================================================================


// ==========================================
// 🛍️ [1] 고객(CST) 서비스 엔드포인트 (일반 사용자용)
// ==========================================

// [1-1] 상품 상세 보기 화면 (수량 선택 및 장바구니/구매 버튼 있는 화면)
// 💡 ':prodId' 변수를 통해 어떤 상품을 클릭했는지 전달받습니다. (예: /purchase/detail/3)
router.get('/detail/:prodId', purchase.purchasedetail);

// [1-2] 장바구니에 담기 처리 (DB 저장)
// 💡 숨겨진 폼 데이터로 상품 번호와 수량이 넘어오므로 POST 방식을 사용합니다.
router.post('/cart_process', purchase.cart_process);

// [1-3] 단건 상품 즉시 구매 처리 (장바구니 안 거치고 바로 결제)
router.post('/pay_process', purchase.pay_process);

// [1-4] 나의 장바구니 목록 보기 화면
router.get('/cart', purchase.cart);

// [1-5] 장바구니 항목 선택 구매 처리 
// 💡 장바구니 화면에서 체크박스로 선택한 항목들을 DB의 구매 테이블(purchase)로 넘깁니다.
router.post('/cart_to_purchase_process', purchase.cart_to_purchase_process);

// [1-6] 고객 장바구니 항목 삭제 처리
// 💡 폼 제출 방식을 통해 삭제할 cart_id 배열을 넘겨받아 처리합니다.
router.post('/cartdelete_process', purchase.cartdelete_process);

// [1-7] 나의 구매 내역 조회 화면
// 실제 주소: /purchase (기본 도메인)
router.get('/', purchase.purchase);

// [1-8] 고객 구매 취소 처리 (Soft Delete - cancel 컬럼만 'Y'로 변경)
// 💡 어떤 구매 건을 취소할지 ':purchaseId' 변수로 받습니다.
router.get('/cancel/:purchaseId', purchase.cancel_process);


// ==========================================
// 🛠️ [2] 관리자(Admin) 테이블 CRUD 서비스 엔드포인트
// ==========================================

// ▶ 장바구니(Cart) 관리 ◀

// [2-1] 관리자용 장바구니 내역 수정 폼 화면
router.get('/cartupdate/:cartId', purchase.cartupdate);

// [2-2] 관리자용 장바구니 내역 수정 DB 반영
router.post('/cartupdate_process', purchase.cartupdate_process);

// [2-3] 관리자용 장바구니 내역 강제 삭제 
// (고객은 POST로 삭제하지만, 관리자 테이블 뷰에서는 a 태그 링크를 클릭해 GET 방식으로 삭제 명령을 내림)
router.get('/cartdelete_process', purchase.cartdelete_process); 


// ▶ 구매내역(Purchase) 관리 ◀

// [2-4] 관리자용 구매 내역 수정 폼 화면
router.get('/purchaseupdate/:purchaseId', purchase.purchaseupdate);

// 💡 호환성 패치 1: tableView.ejs 같은 공용 화면에서는 수정 링크가 기본적으로 '/update/번호' 형태로 
// 만들어질 수 있습니다. 주소창에 저렇게 들어오더라도 에러가 나지 않고 정상적으로 purchaseupdate 로직을 타게 만듭니다.
router.get('/update/:purchaseId', purchase.purchaseupdate); 

// [2-5] 관리자용 구매 내역 수정 DB 반영
router.post('/purchaseupdate_process', purchase.purchaseupdate_process);

// 💡 호환성 패치 2: 위와 마찬가지로 폼 액션이 '/update_process'로 들어오더라도 에러 없이 잘 처리되도록 연결해줍니다.
router.post('/update_process', purchase.purchaseupdate_process); 

// [2-6] 관리자용 구매 내역 완전 삭제 (Hard Delete)
// (고객의 취소와 달리 관리자가 DB에서 기록 자체를 날려버림)
router.get('/delete_process', purchase.delete_process); 


// 3. 만들어진 길잡이(라우터)를 메인 서버로 내보내기
module.exports = router;