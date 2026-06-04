    // main.js
    // 1. 필요한 모듈 임포트
    const express = require('express');
    const app = express();
    const session = require('express-session');
    const MySQLStore = require('express-mysql-session')(session);
    const db = require('./lib/db'); // DB 설정 파일 연결

    // 2. 라우터 모듈 임포트
    const rootRouter = require('./router/rootRouter');
    const authRouter = require('./router/authRouter');
    const codeRouter = require('./router/codeRouter');
    const productRouter = require('./router/productRouter');
    const personRouter = require('./router/personRouter');
    const boardRouter = require('./router/boardRouter');
    const purchaseRouter = require('./router/purchaseRouter');

    // 3. 앱 설정 (View Engine)
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');

    // 4. DB 세션 저장소 설정
    const options = {
        host: 'localhost',
        user: 'root',
        password: 'root', 
        database: 'webdb2026'
    };
    const sessionStore = new MySQLStore(options);

    // 5. 기본 미들웨어 설정
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static('public'));

    // 6. 세션 설정 (라우터 연결보다 위에 위치해야 함)
    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        store: sessionStore 
    }));

    // 7. 라우터 연결
    app.use('/', rootRouter);
    app.use('/auth', authRouter);
    app.use('/code', codeRouter);
    app.use('/product', productRouter);
    app.use('/person', personRouter);
    app.use('/board', boardRouter);
    app.use('/purchase', purchaseRouter);

    // 8. 관리자용 총괄 화면 다이렉트 주소 매핑 (lib/purchase.js 함수 호출)
    const purchaseModule = require('./lib/purchase');

    // [Cart 관리자 기능]
    app.get('/cartview', purchaseModule.cartview);
    app.get('/cartupdate/:cartId', purchaseModule.cartupdate);
    app.post('/cartupdate_process', purchaseModule.cartupdate_process);
    app.get('/cartdelete_admin/:cartId', purchaseModule.cartdelete_admin);

    // [Purchase 관리자 기능]
    app.get('/purchaseview', purchaseModule.purchaseview);
    app.get('/purchaseupdate/:purchaseId', purchaseModule.purchaseupdate);
    app.post('/purchaseupdate_process', purchaseModule.purchaseupdate_process);

    // 9. 서버 실행
    app.listen(3000, () => {
        console.log('서버가 http://localhost:3000 에서 실행 중입니다.');
    });