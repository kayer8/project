-- MySQL dump 10.13  Distrib 5.7.40, for Win64 (x86_64)
--
-- Host: 39.102.119.84    Database: autonomy
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `autonomy`
--

/*!40000 DROP DATABASE IF EXISTS `autonomy`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `autonomy` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `autonomy`;

--
-- Table structure for table `admin_roles`
--

DROP TABLE IF EXISTS `admin_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_roles` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions_json` json NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_roles_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_roles`
--

LOCK TABLES `admin_roles` WRITE;
/*!40000 ALTER TABLE `admin_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_users_email_key` (`email`),
  KEY `admin_users_role_id_fkey` (`role_id`),
  CONSTRAINT `admin_users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_type` enum('USER','ADMIN','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_user_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_admin_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snapshot_json` json DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_resource_type_resource_id_idx` (`resource_type`,`resource_id`),
  KEY `audit_logs_resource_type_action_idx` (`resource_type`,`action`),
  KEY `audit_logs_action_created_at_idx` (`action`,`created_at`),
  KEY `audit_logs_created_at_idx` (`created_at`),
  KEY `audit_logs_actor_type_created_at_idx` (`actor_type`,`created_at`),
  KEY `audit_logs_actor_user_id_fkey` (`actor_user_id`),
  KEY `audit_logs_actor_admin_id_fkey` (`actor_admin_id`),
  CONSTRAINT `audit_logs_actor_admin_id_fkey` FOREIGN KEY (`actor_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `audit_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `buildings` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_no` int DEFAULT NULL,
  `status` enum('ACTIVE','DISABLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `buildings_building_code_key` (`building_code`),
  KEY `buildings_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buildings`
--

LOCK TABLES `buildings` WRITE;
/*!40000 ALTER TABLE `buildings` DISABLE KEYS */;
/*!40000 ALTER TABLE `buildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `communities`
--

DROP TABLE IF EXISTS `communities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `communities` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','DISABLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `communities_code_key` (`code`),
  KEY `communities_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `communities`
--

LOCK TABLES `communities` WRITE;
/*!40000 ALTER TABLE `communities` DISABLE KEYS */;
/*!40000 ALTER TABLE `communities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `community_user_roles`
--

DROP TABLE IF EXISTS `community_user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `community_user_roles` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `community_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_type` enum('COMMITTEE_MEMBER','BUILDING_LEADER','VOLUNTEER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `effective_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expired_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `community_user_roles_community_id_role_type_status_idx` (`community_id`,`role_type`,`status`),
  KEY `community_user_roles_user_id_status_idx` (`user_id`,`status`),
  CONSTRAINT `community_user_roles_community_id_fkey` FOREIGN KEY (`community_id`) REFERENCES `communities` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `community_user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `community_user_roles`
--

LOCK TABLES `community_user_roles` WRITE;
/*!40000 ALTER TABLE `community_user_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `community_user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disclosure_contents`
--

DROP TABLE IF EXISTS `disclosure_contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `disclosure_contents` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publisher` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `summary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `publish_start_at` datetime(3) DEFAULT NULL,
  `publish_end_at` datetime(3) DEFAULT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `disclosure_contents_status_category_idx` (`status`,`category`),
  KEY `disclosure_contents_published_at_idx` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disclosure_contents`
--

LOCK TABLES `disclosure_contents` WRITE;
/*!40000 ALTER TABLE `disclosure_contents` DISABLE KEYS */;
/*!40000 ALTER TABLE `disclosure_contents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `house_member_relations`
--

DROP TABLE IF EXISTS `house_member_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `house_member_relations` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_group_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relation_type` enum('MAIN_OWNER','FAMILY_MEMBER','MAIN_TENANT','CO_RESIDENT','AGENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `relation_label` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary_role` tinyint(1) NOT NULL DEFAULT '0',
  `can_view_bill` tinyint(1) NOT NULL DEFAULT '0',
  `can_pay_bill` tinyint(1) NOT NULL DEFAULT '0',
  `can_act_as_agent` tinyint(1) NOT NULL DEFAULT '0',
  `can_join_consultation` tinyint(1) NOT NULL DEFAULT '0',
  `can_be_vote_delegate` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('PENDING','ACTIVE','REJECTED','INACTIVE','EXPIRED','REMOVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `effective_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expired_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `house_member_relations_house_id_status_idx` (`house_id`,`status`),
  KEY `house_member_relations_household_group_id_status_idx` (`household_group_id`,`status`),
  KEY `house_member_relations_user_id_status_idx` (`user_id`,`status`),
  CONSTRAINT `house_member_relations_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `house_member_relations_household_group_id_fkey` FOREIGN KEY (`household_group_id`) REFERENCES `household_groups` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `house_member_relations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `house_member_relations`
--

LOCK TABLES `house_member_relations` WRITE;
/*!40000 ALTER TABLE `house_member_relations` DISABLE KEYS */;
/*!40000 ALTER TABLE `house_member_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `household_groups`
--

DROP TABLE IF EXISTS `household_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `household_groups` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_type` enum('OWNER_HOUSEHOLD','TENANT_HOUSEHOLD','CO_LIVING_HOUSEHOLD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE','CLOSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ended_at` datetime(3) DEFAULT NULL,
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `household_groups_house_id_status_idx` (`house_id`,`status`),
  KEY `household_groups_group_type_status_idx` (`group_type`,`status`),
  CONSTRAINT `household_groups_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `household_groups`
--

LOCK TABLES `household_groups` WRITE;
/*!40000 ALTER TABLE `household_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `household_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `houses`
--

DROP TABLE IF EXISTS `houses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `houses` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `floor_no` int DEFAULT NULL,
  `room_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_status` enum('SELF_OCCUPIED','RENTED','VACANT','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SELF_OCCUPIED',
  `gross_area` double DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `houses_building_id_unit_no_room_no_key` (`building_id`,`unit_no`,`room_no`),
  KEY `houses_building_id_idx` (`building_id`),
  CONSTRAINT `houses_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `houses`
--

LOCK TABLES `houses` WRITE;
/*!40000 ALTER TABLE `houses` DISABLE KEYS */;
/*!40000 ALTER TABLE `houses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `identity_applications`
--

DROP TABLE IF EXISTS `identity_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `identity_applications` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `community_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_type` enum('OWNER_VERIFY','TENANT_VERIFY','COMMITTEE_VERIFY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `form_json` json NOT NULL,
  `attachments_json` json DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','WITHDRAWN','SUPPLEMENT_REQUIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reviewer_admin_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `review_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reject_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `identity_applications_user_id_status_idx` (`user_id`,`status`),
  KEY `identity_applications_community_id_status_idx` (`community_id`,`status`),
  KEY `identity_applications_house_id_status_idx` (`house_id`,`status`),
  KEY `identity_applications_reviewer_admin_id_fkey` (`reviewer_admin_id`),
  CONSTRAINT `identity_applications_community_id_fkey` FOREIGN KEY (`community_id`) REFERENCES `communities` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `identity_applications_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `identity_applications_reviewer_admin_id_fkey` FOREIGN KEY (`reviewer_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `identity_applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `identity_applications`
--

LOCK TABLES `identity_applications` WRITE;
/*!40000 ALTER TABLE `identity_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `identity_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `management_fee_periods`
--

DROP TABLE IF EXISTS `management_fee_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `management_fee_periods` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_month` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `charge_start_date` datetime(3) NOT NULL,
  `charge_end_date` datetime(3) NOT NULL,
  `due_date` datetime(3) NOT NULL,
  `pricing_mode` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AREA_UNIFORM',
  `unit_price` double DEFAULT NULL,
  `base_amount` double NOT NULL DEFAULT '0',
  `default_area` double NOT NULL DEFAULT '88',
  `pricing_rule_json` json DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `management_fee_periods_period_key_key` (`period_key`),
  KEY `management_fee_periods_charge_start_date_charge_end_date_idx` (`charge_start_date`,`charge_end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `management_fee_periods`
--

LOCK TABLES `management_fee_periods` WRITE;
/*!40000 ALTER TABLE `management_fee_periods` DISABLE KEYS */;
/*!40000 ALTER TABLE `management_fee_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `management_fee_records`
--

DROP TABLE IF EXISTS `management_fee_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `management_fee_records` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `period_month` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `charge_start_date` datetime(3) DEFAULT NULL,
  `charge_end_date` datetime(3) DEFAULT NULL,
  `due_date` datetime(3) DEFAULT NULL,
  `gross_area_snapshot` double DEFAULT NULL,
  `unit_price_snapshot` double DEFAULT NULL,
  `base_amount_snapshot` double DEFAULT NULL,
  `receivable_amount` double DEFAULT NULL,
  `paid_amount` double DEFAULT NULL,
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual_import',
  `paid_at` datetime(3) DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `management_fee_records_period_key_house_id_key` (`period_key`,`house_id`),
  KEY `management_fee_records_period_key_payment_status_idx` (`period_key`,`payment_status`),
  KEY `management_fee_records_period_id_payment_status_idx` (`period_id`,`payment_status`),
  KEY `management_fee_records_period_month_payment_status_idx` (`period_month`,`payment_status`),
  KEY `management_fee_records_house_id_idx` (`house_id`),
  CONSTRAINT `management_fee_records_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `management_fee_records_period_id_fkey` FOREIGN KEY (`period_id`) REFERENCES `management_fee_periods` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `management_fee_records`
--

LOCK TABLES `management_fee_records` WRITE;
/*!40000 ALTER TABLE `management_fee_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `management_fee_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_change_requests`
--

DROP TABLE IF EXISTS `member_change_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `member_change_requests` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `household_group_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_type` enum('ADD_MEMBER','REMOVE_MEMBER','EXPIRE_MEMBER','CHANGE_PERMISSION','CHANGE_PRIMARY_ROLE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator_user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_user_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_relation_type` enum('MAIN_OWNER','FAMILY_MEMBER','MAIN_TENANT','CO_RESIDENT','AGENT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permission_json` json DEFAULT NULL,
  `attachments_json` json DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','WITHDRAWN','SUPPLEMENT_REQUIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reviewer_admin_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `review_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `member_change_requests_house_id_status_idx` (`house_id`,`status`),
  KEY `member_change_requests_household_group_id_status_idx` (`household_group_id`,`status`),
  KEY `member_change_requests_operator_user_id_status_idx` (`operator_user_id`,`status`),
  KEY `member_change_requests_target_user_id_status_idx` (`target_user_id`,`status`),
  KEY `member_change_requests_reviewer_admin_id_fkey` (`reviewer_admin_id`),
  CONSTRAINT `member_change_requests_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `member_change_requests_household_group_id_fkey` FOREIGN KEY (`household_group_id`) REFERENCES `household_groups` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `member_change_requests_operator_user_id_fkey` FOREIGN KEY (`operator_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `member_change_requests_reviewer_admin_id_fkey` FOREIGN KEY (`reviewer_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `member_change_requests_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_change_requests`
--

LOCK TABLES `member_change_requests` WRITE;
/*!40000 ALTER TABLE `member_change_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_change_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_requests`
--

DROP TABLE IF EXISTS `registration_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registration_requests` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','REVIEWED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `review_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `registration_requests_user_id_status_idx` (`user_id`,`status`),
  KEY `registration_requests_mobile_status_idx` (`mobile`,`status`),
  KEY `registration_requests_building_id_status_idx` (`building_id`,`status`),
  KEY `registration_requests_house_id_fkey` (`house_id`),
  CONSTRAINT `registration_requests_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `registration_requests_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `registration_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_requests`
--

LOCK TABLES `registration_requests` WRITE;
/*!40000 ALTER TABLE `registration_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `registration_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resident_archives`
--

DROP TABLE IF EXISTS `resident_archives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resident_archives` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `real_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `building_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relation_type` enum('MAIN_OWNER','FAMILY_MEMBER','MAIN_TENANT','CO_RESIDENT','AGENT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relation_label` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','DISABLED','SYNCED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `matched_user_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matched_at` datetime(3) DEFAULT NULL,
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `resident_archives_mobile_status_idx` (`mobile`,`status`),
  KEY `resident_archives_house_id_status_idx` (`house_id`,`status`),
  KEY `resident_archives_matched_user_id_status_idx` (`matched_user_id`,`status`),
  KEY `resident_archives_building_id_fkey` (`building_id`),
  CONSTRAINT `resident_archives_building_id_fkey` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `resident_archives_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `resident_archives_matched_user_id_fkey` FOREIGN KEY (`matched_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resident_archives`
--

LOCK TABLES `resident_archives` WRITE;
/*!40000 ALTER TABLE `resident_archives` DISABLE KEYS */;
/*!40000 ALTER TABLE `resident_archives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile_verified_at` datetime(3) DEFAULT NULL,
  `wechat_openid` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wechat_unionid` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `real_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','DISABLED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `register_source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'wechat_miniapp',
  `last_login_at` datetime(3) DEFAULT NULL,
  `last_login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_wechat_openid_key` (`wechat_openid`),
  UNIQUE KEY `users_mobile_key` (`mobile`),
  UNIQUE KEY `users_wechat_unionid_key` (`wechat_unionid`),
  KEY `users_status_idx` (`status`),
  KEY `users_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vote_ballots`
--

DROP TABLE IF EXISTS `vote_ballots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vote_ballots` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vote_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vote_ballots_vote_id_house_id_key` (`vote_id`,`house_id`),
  KEY `vote_ballots_vote_id_user_id_idx` (`vote_id`,`user_id`),
  KEY `vote_ballots_option_id_idx` (`option_id`),
  KEY `vote_ballots_user_id_fkey` (`user_id`),
  KEY `vote_ballots_house_id_fkey` (`house_id`),
  CONSTRAINT `vote_ballots_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `vote_ballots_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `vote_options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vote_ballots_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `vote_ballots_vote_id_fkey` FOREIGN KEY (`vote_id`) REFERENCES `votes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vote_ballots`
--

LOCK TABLES `vote_ballots` WRITE;
/*!40000 ALTER TABLE `vote_ballots` DISABLE KEYS */;
/*!40000 ALTER TABLE `vote_ballots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vote_options`
--

DROP TABLE IF EXISTS `vote_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vote_options` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vote_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_text` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_no` int NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vote_options_vote_id_sort_no_idx` (`vote_id`,`sort_no`),
  CONSTRAINT `vote_options_vote_id_fkey` FOREIGN KEY (`vote_id`) REFERENCES `votes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vote_options`
--

LOCK TABLES `vote_options` WRITE;
/*!40000 ALTER TABLE `vote_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `vote_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vote_representatives`
--

DROP TABLE IF EXISTS `vote_representatives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vote_representatives` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `house_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `representative_relation_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grantor_relation_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scope_type` enum('LONG_TERM','SINGLE_VOTE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `vote_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effective_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expired_at` datetime(3) DEFAULT NULL,
  `status` enum('ACTIVE','EXPIRED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `cancel_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_admin_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vote_representatives_house_id_status_idx` (`house_id`,`status`),
  KEY `vote_representatives_representative_relation_id_status_idx` (`representative_relation_id`,`status`),
  KEY `vote_representatives_vote_id_idx` (`vote_id`),
  KEY `vote_representatives_grantor_relation_id_fkey` (`grantor_relation_id`),
  KEY `vote_representatives_created_by_user_id_fkey` (`created_by_user_id`),
  KEY `vote_representatives_created_by_admin_id_fkey` (`created_by_admin_id`),
  CONSTRAINT `vote_representatives_created_by_admin_id_fkey` FOREIGN KEY (`created_by_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `vote_representatives_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `vote_representatives_grantor_relation_id_fkey` FOREIGN KEY (`grantor_relation_id`) REFERENCES `house_member_relations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `vote_representatives_house_id_fkey` FOREIGN KEY (`house_id`) REFERENCES `houses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `vote_representatives_representative_relation_id_fkey` FOREIGN KEY (`representative_relation_id`) REFERENCES `house_member_relations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vote_representatives`
--

LOCK TABLES `vote_representatives` WRITE;
/*!40000 ALTER TABLE `vote_representatives` DISABLE KEYS */;
/*!40000 ALTER TABLE `vote_representatives` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `votes`
--

DROP TABLE IF EXISTS `votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `votes` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sponsor` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
  `scope_audience` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OWNER',
  `scope_building_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scope_building_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scope_building_ids_json` json DEFAULT NULL,
  `scope_building_names_json` json DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `total_households` int NOT NULL DEFAULT '0',
  `participant_count` int NOT NULL DEFAULT '0',
  `pass_rate` double NOT NULL DEFAULT '0',
  `result` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `deadline` datetime(3) DEFAULT NULL,
  `published_at` datetime(3) DEFAULT NULL,
  `ended_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `votes_status_type_idx` (`status`,`type`),
  KEY `votes_deadline_idx` (`deadline`),
  KEY `votes_published_at_idx` (`published_at`),
  KEY `votes_ended_at_idx` (`ended_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `votes`
--

LOCK TABLES `votes` WRITE;
/*!40000 ALTER TABLE `votes` DISABLE KEYS */;
/*!40000 ALTER TABLE `votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'autonomy'
--

--
-- Dumping routines for database 'autonomy'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-24 20:43:24
