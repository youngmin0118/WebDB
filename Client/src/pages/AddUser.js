import React, { useState } from 'react';
import axios from 'axios';

function AddUser() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const SERVER_URL = 'http://localhost:5000';

  const addUser = async () => {
    if (!name || !age) {
      alert('이름과 나이를 입력하세요.');
      return;
    }

    try {
      await axios.post(`${SERVER_URL}/users`, {
        name,
        age: Number(age)
      });

      alert('사용자 추가 성공');
      setName('');
      setAge('');
    } catch (error) {
      console.error('사용자 추가 실패:', error);
    }
  };

  return (
    <div>
      <h1>사용자 추가</h1>
      <input
        type="text"
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginRight: '10px', padding: '8px' }}
      />
      <input
        type="number"
        placeholder="나이"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        style={{ marginRight: '10px', padding: '8px' }}
      />
      <button onClick={addUser}>추가</button>
    </div>
  );
}

export default AddUser;