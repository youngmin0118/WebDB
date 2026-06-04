require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');
const topic = require('./lib/topic')

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 기본 테스트
app.get('/', (req, res) => {
  res.send('Node.js 서버가 실행 중입니다.');
});


app.get('/product', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM product ');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '사용자 조회 중 오류가 발생했습니다.' });
  }
});


app.post("/product/add", async (req, res) => {
  const { name, price, brand } = req.body;

  const sql = `
    INSERT INTO product 
    (main_id, sub_id,name, price, stock,brand,supplier) 
    VALUES ('0005','0005',?, ?, 1, ?, 'react')
  `;

  try {
    const [result] = await db.query(sql, [name, price, brand]);

    res.json({
      message: "상품 등록 성공",
      prod_id: result.insertId,
    });
  } catch (err) {
    console.error("상품 등록 실패:", err);
    res.status(500).json({ message: "상품 등록 실패" });
  }
});

app.get("/product/edit/:prod_id", async (req, res) => {
  const { prod_id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM product WHERE prod_id = ?",
      [prod_id]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "상품 조회 실패" });
  }
});

// 상품 수정
app.put("/product/edit/:prod_id", async (req, res) => {
  const { prod_id } = req.params;
  const { name, price, brand } = req.body;

  try {
    await db.query(
      "UPDATE product SET name = ?, price = ?, brand = ? WHERE prod_id = ?",
      [name, price, brand, prod_id]
    );

    res.json({ message: "상품 수정 성공" });
  } catch (err) {
    res.status(500).json({ message: "상품 수정 실패" });
  }
});

// 상품 삭제
app.delete("/product/delete/:prod_id", async (req, res) => {
  const { prod_id } = req.params;

  try {
    await db.query(
      "DELETE FROM product WHERE prod_id = ?",
      [prod_id]
    );

    res.json({ message: "상품 삭제 성공" });
  } catch (err) {
    res.status(500).json({ message: "상품 삭제 실패" });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});