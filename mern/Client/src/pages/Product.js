import { useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';

function Product() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const getProducts = () => {
    fetch("http://localhost:5000/product")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("상품 데이터 가져오기 실패:", err));
  };

  useEffect(() => {
    getProducts();
  }, []);

  const deleteProduct = (prod_id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    fetch(`http://localhost:5000/product/delete/${prod_id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        alert("삭제되었습니다.");
        getProducts();
      })
      .catch((err) => console.error("삭제 실패:", err));
  };

  return (
    <div style={{ padding: '30px' }}>


      <input type="text" placeholder="Search" />
      <button>Search</button>

      <br /><br /><br />

      <table border="1" width="100%" cellPadding="0">
        <thead>
          <tr>
            <th>상품</th>
            <th>상품명</th>
            <th>가격</th>
            <th>브랜드</th>
            <th>수정</th>
            <th>삭제</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.prod_id}>
              <td><img   src=''   width="100"     alt={product.name}  /></td>

              <td>{product.name}</td>
              <td>{product.price}원</td>
              <td>{product.brand}</td>

               <td>
                <button onClick={() => navigate(`/product/edit/${product.prod_id}`)}>
                  수정
                </button>
              </td>

              <td>
                <button onClick={() => deleteProduct(product.prod_id)}>
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <button onClick={() => navigate("/product/add")}>상품 추가</button>
    </div>
  );
}

export default Product;