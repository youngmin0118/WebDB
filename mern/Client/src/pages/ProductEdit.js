import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ProductEdit() {
  const { prod_id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [brand, setBrand] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/product/edit/${prod_id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.name);
        setPrice(data.price);
        setBrand(data.brand);
      })
      .catch((err) => console.error("상품 조회 실패:", err));
  }, [prod_id]);

  const updateProduct = (e) => {
    e.preventDefault();

    fetch(`http://localhost:5000/product/edit/${prod_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        price,
        brand,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert("수정되었습니다.");
        navigate("/product");
      })
      .catch((err) => console.error("수정 실패:", err));
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>상품 수정</h2>

      <form onSubmit={updateProduct}>
        <div>
          <label>상품명</label><br />
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <br />

        <div>
          <label>가격</label><br />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <br />

        <div>
          <label>브랜드</label><br />
          <input value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>

        <br />

        <button type="submit">수정 완료</button>
        <button type="button" onClick={() => navigate("/product")}>
          취소
        </button>
      </form>
    </div>
  );
}

export default ProductEdit;