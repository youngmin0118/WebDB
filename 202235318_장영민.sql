CREATE DATABASE  IF NOT EXISTS `webdb2026` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `webdb2026`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: webdb2026
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appslist`
--

DROP TABLE IF EXISTS `appslist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appslist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `class` varchar(100) NOT NULL,
  `installdate` datetime NOT NULL,
  `descript` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='앱 리스트 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appslist`
--

LOCK TABLES `appslist` WRITE;
/*!40000 ALTER TABLE `appslist` DISABLE KEYS */;
INSERT INTO `appslist` VALUES (1,'카카오T','네비/지도','2026-03-27 17:30:32','카카오에서 만든 네비게이션 앱. 최근 사용자 증가'),(2,'Trip.com','여행','2026-03-27 17:30:32','여행 관련 상품 예약 앱. 항공권을 저렴하게 구매할 수도 있음'),(3,'SSG.COM','온라인쇼핑','2026-03-27 17:30:32','신세계 온라인 쇼핑몰. 모든 분야의 상품을 판매함');
/*!40000 ALTER TABLE `appslist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `author`
--

DROP TABLE IF EXISTS `author`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `author` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `profile` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='저자 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `author`
--

LOCK TABLES `author` WRITE;
/*!40000 ALTER TABLE `author` DISABLE KEYS */;
INSERT INTO `author` VALUES (1,'장영민','developer'),(3,'홍길동','학생');
/*!40000 ALTER TABLE `author` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board`
--

DROP TABLE IF EXISTS `board`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board` (
  `board_id` int NOT NULL AUTO_INCREMENT,
  `type_id` int DEFAULT NULL,
  `p_id` int DEFAULT '0',
  `loginid` varchar(10) NOT NULL,
  `password` varchar(20) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `date` varchar(20) DEFAULT NULL,
  `content` text,
  PRIMARY KEY (`board_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `board_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `boardtype` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시판 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board`
--

LOCK TABLES `board` WRITE;
/*!40000 ALTER TABLE `board` DISABLE KEYS */;
INSERT INTO `board` VALUES (37,1,37,'admin','1234','불만사항 11','2026-05-29 09:36:20','111'),(38,1,37,'admin','1234','[답변] : 불만사항 11','2026-05-29 09:36:25','111');
/*!40000 ALTER TABLE `board` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `boardtype`
--

DROP TABLE IF EXISTS `boardtype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boardtype` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` varchar(400) DEFAULT NULL,
  `write_YN` varchar(1) NOT NULL,
  `re_YN` varchar(1) NOT NULL,
  `numPerPage` int DEFAULT NULL,
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='모든 게시판 종류 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boardtype`
--

LOCK TABLES `boardtype` WRITE;
/*!40000 ALTER TABLE `boardtype` DISABLE KEYS */;
INSERT INTO `boardtype` VALUES (1,'Q & A','질의 응답 전용 게시판','Y','Y',4),(2,'공지사항','쇼핑몰 관련 공지사항 개제','N','N',2),(3,'상품후기','고객들의 상품 후기 관련','Y','Y',2),(4,'고객 불만','고객 불만에 관한 글','Y','Y',2),(5,'환불 및 취소 관련','환불 요청에 관한 게시글','Y','Y',2);
/*!40000 ALTER TABLE `boardtype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `cart_id` int NOT NULL AUTO_INCREMENT COMMENT '카트 번호',
  `loginid` varchar(50) NOT NULL COMMENT '로그인 아이디',
  `prod_id` int NOT NULL COMMENT '상품 아이디',
  `date` varchar(50) NOT NULL COMMENT '장바구니 담긴 날짜',
  PRIMARY KEY (`cart_id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='장바구니 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (119,'admin',2,'2026.05.28: 11시 08분 29초');
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `code`
--

DROP TABLE IF EXISTS `code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `code` (
  `main_id` varchar(4) NOT NULL,
  `sub_id` varchar(4) NOT NULL,
  `main_name` varchar(20) NOT NULL,
  `sub_name` varchar(100) DEFAULT NULL,
  `start` varchar(8) NOT NULL,
  `end` varchar(8) NOT NULL,
  PRIMARY KEY (`main_id`,`sub_id`,`start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코드 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `code`
--

LOCK TABLES `code` WRITE;
/*!40000 ALTER TABLE `code` DISABLE KEYS */;
INSERT INTO `code` VALUES ('옷','반팔티','옷','반팔티','20200101','20211212'),('옷','카라티','옷','카라티','20121212','20211212');
/*!40000 ALTER TABLE `code` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `person`
--

DROP TABLE IF EXISTS `person`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `person` (
  `loginid` varchar(10) NOT NULL,
  `password` varchar(20) NOT NULL,
  `name` varchar(20) NOT NULL,
  `mf` varchar(1) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `tel` varchar(13) DEFAULT NULL,
  `birth` varchar(8) NOT NULL,
  `class` varchar(3) NOT NULL,
  PRIMARY KEY (`loginid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='모든 회원 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `person`
--

LOCK TABLES `person` WRITE;
/*!40000 ALTER TABLE `person` DISABLE KEYS */;
INSERT INTO `person` VALUES ('admin','1234','관리자','M','서울','010-1234-5678','19800506','MNG'),('manager','1234','과제용경영진','M','서울','010-1111-2222','19900101','CEO'),('user1','1234','고객1','F','인천','010-3333-4444','20000514','CST'),('user2','1234','홍길동2','M','대구','010-1234-5678','20030118','CST');
/*!40000 ALTER TABLE `person` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `prod_id` int NOT NULL AUTO_INCREMENT,
  `main_id` varchar(4) NOT NULL,
  `sub_id` varchar(4) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` int NOT NULL,
  `stock` int NOT NULL,
  `brand` varchar(4) NOT NULL,
  `supplier` varchar(4) NOT NULL,
  `image` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`prod_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='모든 상품 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,'옷','반팔티','하얀 반팔티',23000,22,'가천','영민','cloth_1.jpg'),(2,'옷','카라티','남색 카라티',30000,10,'가천','영민','cloth_2.jpg');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase`
--

DROP TABLE IF EXISTS `purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase` (
  `purchase_id` int NOT NULL AUTO_INCREMENT,
  `loginid` varchar(10) NOT NULL,
  `prod_id` int DEFAULT NULL,
  `date` varchar(30) NOT NULL,
  `price` int DEFAULT NULL,
  `point` int DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `total` int DEFAULT NULL,
  `payYN` varchar(1) NOT NULL DEFAULT 'N',
  `cancel` varchar(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`purchase_id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='구매 로그 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase`
--

LOCK TABLES `purchase` WRITE;
/*!40000 ALTER TABLE `purchase` DISABLE KEYS */;
INSERT INTO `purchase` VALUES (83,'user1',1,'2026.05.21: 11시 17분 59초',23000,115,1,23000,'Y','Y'),(84,'user1',1,'2026.05.21: 17시 22분 12초',23000,115,1,23000,'Y','Y'),(85,'user1',1,'2026.05.21: 17시 22분 20초',23000,115,1,23000,'Y','Y'),(86,'user1',1,'2026.05.21: 19시 09분 13초',23000,115,1,23000,'Y','N'),(87,'user2',1,'2026.05.21: 19시 13분 39초',23000,115,1,23000,'Y','N'),(88,'user1',1,'2026.05.28: 10시 09분 38초',23000,115,1,23000,'Y','N'),(89,'user1',1,'2026.05.28: 10시 09분 43초',23000,115,1,23000,'Y','N'),(90,'user1',1,'2026.05.28: 10시 09분 51초',23000,115,1,23000,'Y','N'),(91,'user1',1,'2026.05.28: 10시 10분 00초',23000,2530,22,506000,'Y','N'),(92,'user1',1,'2026.05.28: 10시 26분 06초',23000,115,1,23000,'Y','N'),(93,'user1',1,'2026.05.28: 10시 27분 03초',23000,115,1,23000,'Y','Y'),(94,'user1',1,'2026.05.28: 10시 34분 14초',23000,115,1,23000,'Y','N'),(95,'user1',1,'2026.05.28: 10시 38분 10초',23000,115,1,23000,'Y','N'),(96,'admin',2,'2026.05.28: 11시 08분 33초',30000,150,1,30000,'Y','N');
/*!40000 ALTER TABLE `purchase` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='세션 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('61HO5Yh1mJFFNdXzP5eDiHBxKEe_IeJs',1780031720,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"}}'),('s6wEC-f2HFKvGZyxKMUzdZPCHwqGqQkb',1780101386,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"is_logined\":true,\"loginid\":\"admin\",\"name\":\"과제용관리자\",\"cls\":\"MNG\"}'),('uMWbMb5v4UcKqui3kiOy_2_tzMuJCJMw',1780623003,'{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"}}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topic`
--

DROP TABLE IF EXISTS `topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topic` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(30) NOT NULL,
  `descript` text,
  `created` datetime NOT NULL,
  `author_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='토픽 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topic`
--

LOCK TABLES `topic` WRITE;
/*!40000 ALTER TABLE `topic` DISABLE KEYS */;
INSERT INTO `topic` VALUES (1,'MySQL','MySQL is Database Name.','2023-09-20 00:00:00',1),(2,'Node.js','Node.js is runtime of javascript','2023-09-20 00:00:00',1),(3,'HTML','HTML is Hyper Text Markup Language','2023-09-20 00:00:00',1),(4,'CSS','CSS is used to decorate HTML Page.','2023-09-20 00:00:00',1),(5,'express','express is the framework for web service.','2023-09-20 00:00:00',1),(9,'날씨','맑은날','2026-04-09 10:02:41',1),(10,'온도','현재 온도는 30도','2026-04-09 10:46:51',3);
/*!40000 ALTER TABLE `topic` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-04 10:35:53
