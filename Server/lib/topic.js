require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./db');


const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

module.exports = {
    home : async (req,res)=>{
      try {
        const [rows] = await db.query('SELECT * FROM topic ORDER BY id DESC');
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'topic 조회 중 오류가 발생했습니다.' });
      }
    },

    
}