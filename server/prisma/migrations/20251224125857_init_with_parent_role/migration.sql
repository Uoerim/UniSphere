/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Entity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Value` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Value` DROP FOREIGN KEY `Value_attributeId_fkey`;

-- DropForeignKey
ALTER TABLE `Value` DROP FOREIGN KEY `Value_entityId_fkey`;

-- DropTable
DROP TABLE `Account`;

-- DropTable
DROP TABLE `Attribute`;

-- DropTable
DROP TABLE `Entity`;

-- DropTable
DROP TABLE `Value`;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'STUDENT', 'PARENT') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `entityId` VARCHAR(191) NULL,

    UNIQUE INDEX `accounts_email_key`(`email`),
    UNIQUE INDEX `accounts_entityId_key`(`entityId`),
    INDEX `accounts_email_idx`(`email`),
    INDEX `accounts_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entities` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('STUDENT', 'PARENT', 'STAFF', 'COURSE', 'DEPARTMENT', 'BUILDING', 'ROOM', 'EVENT', 'ANNOUNCEMENT', 'ENROLLMENT', 'GRADE', 'ATTENDANCE') NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `parentId` VARCHAR(191) NULL,

    INDEX `entities_type_idx`(`type`),
    INDEX `entities_parentId_idx`(`parentId`),
    INDEX `entities_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attributes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `dataType` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME', 'TEXT', 'EMAIL', 'PHONE', 'URL') NOT NULL,
    `category` ENUM('PERSONAL', 'ACADEMIC', 'CONTACT', 'EMPLOYMENT', 'FACILITY', 'SCHEDULE', 'FINANCIAL', 'SYSTEM') NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `isUnique` BOOLEAN NOT NULL DEFAULT false,
    `isSearchable` BOOLEAN NOT NULL DEFAULT true,
    `entityTypes` TEXT NOT NULL,
    `validationRules` TEXT NULL,
    `defaultValue` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attributes_name_key`(`name`),
    INDEX `attributes_category_idx`(`category`),
    INDEX `attributes_dataType_idx`(`dataType`),
    INDEX `attributes_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `values` (
    `id` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `attributeId` VARCHAR(191) NOT NULL,
    `valueString` VARCHAR(500) NULL,
    `valueNumber` DOUBLE NULL,
    `valueBool` BOOLEAN NULL,
    `valueDate` DATE NULL,
    `valueDateTime` DATETIME(3) NULL,
    `valueText` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `values_entityId_idx`(`entityId`),
    INDEX `values_attributeId_idx`(`attributeId`),
    UNIQUE INDEX `values_entityId_attributeId_key`(`entityId`, `attributeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entity_relations` (
    `id` VARCHAR(191) NOT NULL,
    `fromEntityId` VARCHAR(191) NOT NULL,
    `toEntityId` VARCHAR(191) NOT NULL,
    `relationType` VARCHAR(191) NOT NULL,
    `metadata` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `entity_relations_fromEntityId_idx`(`fromEntityId`),
    INDEX `entity_relations_toEntityId_idx`(`toEntityId`),
    INDEX `entity_relations_relationType_idx`(`relationType`),
    UNIQUE INDEX `entity_relations_fromEntityId_toEntityId_relationType_key`(`fromEntityId`, `toEntityId`, `relationType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_entityId_fkey` FOREIGN KEY (`entityId`) REFERENCES `entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entities` ADD CONSTRAINT `entities_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `values` ADD CONSTRAINT `values_entityId_fkey` FOREIGN KEY (`entityId`) REFERENCES `entities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `values` ADD CONSTRAINT `values_attributeId_fkey` FOREIGN KEY (`attributeId`) REFERENCES `attributes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_relations` ADD CONSTRAINT `entity_relations_fromEntityId_fkey` FOREIGN KEY (`fromEntityId`) REFERENCES `entities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_relations` ADD CONSTRAINT `entity_relations_toEntityId_fkey` FOREIGN KEY (`toEntityId`) REFERENCES `entities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
