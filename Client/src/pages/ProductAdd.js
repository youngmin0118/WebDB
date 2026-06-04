import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ProductAdd() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [brand, setBrand] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const product = {
      name: name,
      price: price,
      brand: brand,
    };

    fetch("http://localhost:5000/product/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("상품 등록 성공:", data);
        navigate("/product");
      })
      .catch((err) => {
        console.error("상품 등록 실패:", err);
      });
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>상품 추가</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>상품명</label>
          <br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>가격</label>
          <br />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>브랜드</label>
          <br />
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <br />

        <button type="submit">생성</button>
        <button type="button" onClick={() => navigate("/product")}>
          취소
        </button>
      </form>
    </div>
  );
}

export default ProductAdd;