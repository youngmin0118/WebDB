import './style.css';
import { FaBars, FaThLarge, FaBox, FaRegSquare, FaChartPie, FaChartLine, FaPlug, FaCompass, FaHistory, FaSignOutAlt } from 'react-icons/fa';
import {  Routes, Route, Link} from 'react-router-dom';

import Product from './pages/Product';
import ProductAdd from './pages/ProductAdd';
import ProductEdit from "./pages/ProductEdit";
import { useState } from 'react';
function App() {

  const [sidebarClose, setSidebarClose] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  const toggleSidebar = () => {
    setSidebarClose(!sidebarClose);
  };

  const toggleMenu = (menuName) => {
    setOpenMenus({
      ...openMenus,
      [menuName]: !openMenus[menuName]
    });
  };

  return (
      <div>
      <div className={`sidebar ${sidebarClose ? 'close' : ''}`}>
         <div className="logo-details">
            <a href="/"><i className='bx bxl-c-plus-plus'></i></a>
            <span className="logo_name">GCShop</span>
         </div>

         <ul className="nav-links">
            <li>
               <a href="#">
                  <i className='bx bxs-grid-alt'></i>
                  <span className="link_name">Dashboard</span>
               </a>
               <ul className="sub-menu blank">
                  <li><a className = "link_name" href="#" >Dashboard</a></li>
               </ul>
            </li>
            <li className={openMenus.category ? 'showMenu' : ''}>
               <div className="icon-link">
                  <a href="#">
                     <i className='bx bx-collection'></i>
                     <span className="link_name">Category</span>
                  </a>
                  <i className='bx bxs-chevron-down arrow' onClick={() => toggleMenu('category')} ></i>
               </div>
               <ul className="sub-menu">
                  <li><a className = "link_name" href="#" >Category</a></li>
                  
                  <li><a href="/category/%>">게시판</a></li>
                  
               </ul>
            </li>
            <li className={openMenus.board ? 'showMenu' : ''}> 
               <div className="icon-link">
                  <a href="#">
                     <i className='bx bx-book-alt'></i>
                     <span className="link_name">Board</span>
                  </a>
                  <i className='bx bxs-chevron-down arrow' onClick={() => toggleMenu('board')} ></i>
               </div>
               <ul className="sub-menu">
                  <li><a className = "link_name" href="#" >Board</a></li>
                  <li><a href="/board/view/1">공지사항</a></li>
               </ul>
            </li>

            <li >
               <a href="/purchase">
                  <i className='bx bx-purchase-tag-alt' ></i>
                  <span className="link_name">Purchase List</span>
               </a>
               <ul className="sub-menu blank" >
                  <li><a className="link_name" href="/purchase">Purchase List</a></li>
               </ul>
            </li>

            <li>
               <a href="/purchase/cart">
                  <i className='bx bx-cart'></i>
                  <span className="link_name">Cart</span>
               </a>
               <ul className="sub-menu blank" >
                  <li><a className="link_name" href="/purchase/cart">Cart</a></li>
               </ul>
            </li>


            <li className={openMenus.dbadmin ? 'showMenu' : ''}>
               <div className="icon-link">
                  <a href="#">
                     <i className='bx bx-data'></i>
                     <span className="link_name">DB Admin</span>
                  </a>
                  <i className='bx bxs-chevron-down arrow' onClick={() => toggleMenu('dbadmin')} ></i>
               </div>
               <ul className="sub-menu">
                  <li><a className = "link_name" href="#" >DB Admin</a></li>
                  <li><a href="/table">Table Manage</a></li>
                  <li><a href="/cartview"> cart RUD </a></li>
                  <li><a href="/code/view"> code CRUD </a></li>

                  <li><Link to="/product" >product CRUD</Link></li>

                  <li><a href="/purchaseview" >purchase RUD</a></li>
                  <li><a href="/person/view" >person CRUD</a></li>
                  <li><a href="/board/type/view" >board type CRUD</a></li>
               </ul>
            </li>

            <li>
               <a href="/anal/customer">
                  <i className='bx bx-pie-chart-alt-2'></i>
                  <span className="link_name">Analytic</span>
               </a>
               <ul className="sub-menu blank">
                  <li><a className = "link_name" href="/anal/customer" >Analytic</a></li>
               </ul>
            </li>

            
            <li className={openMenus.setting ? 'showMenu' : ''}>
               <div className="icon-link">
                  <a href="#">
                     <i className='bx bx-cog'></i>
                     <span className="link_name">Setting</span>
                  </a>
                  <i className='bx bxs-chevron-down arrow' onClick={() => toggleMenu('setting')} ></i>
               </div>
               <ul className="sub-menu">
                  <li><a className = "link_name" href="#" >Setting</a></li>
                  <li><a href="/auth/register" >회원가입</a></li>
                  <li><a href="#" >아이디/비번 찾기</a></li>
               </ul>
            </li>

            <li>
               <div className="profile-details">
                  <div className="profile-content">
                     <img src="" alt="profile" />
                  </div>
                  <div className="name-job">
                     <div className="profile_name">Wang</div>
                     <div className="job"></div>
                  </div>
                  
                  
                     <a href="/auth/login"><i className='bx bx-log-in'></i></a>
                 
                 
               </div>
            </li>

         </ul>
      </div>


      <section className="home-section">
         <div className="home-content">
            <i className='bx bx-menu' ></i>
            <span className="text">Drop Down Sidebar(이름:학번)</span>
         </div>
         <div>
            <form className="d-flex" role="search" action="/search" method="post">
               <input className="form-control me-1" style={{width : '150px', marginLeft : '50px'}} type="search"
                placeholder="Search" aria-label="Search" name="search" />
               <button className="btn btn-outline-success" type="submit">Search</button>
            </form>
         </div>
 
         <div className="home-content2">

            <Routes>
               <Route  path="/product"  element={<Product />} />
               <Route path="/product/add" element={<ProductAdd />} />
               <Route path="/product/edit/:prod_id" element={<ProductEdit />} />
            </Routes>
           
         </div>
      </section> </div>) }
      

export default App;