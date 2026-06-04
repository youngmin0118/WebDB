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

// 3. 앱 설정 (View Engine)
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// 4. DB 세션 저장소 설정 (db.js와 동일한 정보 사용)
const options = {
    host: 'localhost',
    user: 'root',
    password: 'root', // 실제 MySQL 비밀번호로 확인해 주세요
    database: 'webdb2026'
};
const sessionStore = new MySQLStore(options);

// 5. 기본 미들웨어 설정 (순서 주의!)
// 요청 몸체 파싱 및 정적 파일 경로 지정은 세션보다 위에 있어도 괜찮습니다.
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// 6. [중요] 세션 설정 (반드시 라우터 연결보다 위에 있어야 함!)
// 모든 라우터가 req.session을 인식할 수 있게 해주는 "보따리"를 만드는 단계입니다.
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: sessionStore // 세션 정보를 DB(MySQL)에 저장합니다.
}));

// 7. [중요] 라우터 연결 (세션 설정이 끝난 후에 연결합니다)
// 이제 이 라우터들 안에서 req.session.is_logined를 읽을 수 있습니다.
app.use('/', rootRouter);
app.use('/auth', authRouter);
app.use('/code', codeRouter);
app.use('/product', productRouter);
app.use('/person', personRouter);
app.use('/board', boardRouter);

// 8. 에러 처리 및 서버 실행
app.use((req, res, next) => {
    res.status(404).send('페이지를 찾을 수 없습니다.');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('서버 에러가 발생했습니다.');
});

app.listen(3000, () => {
    console.log('Gachon Shop 서버가 3000번 포트에서 실행 중입니다!');
});