-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `nickname` VARCHAR(40) NOT NULL,
    `avatar_key` VARCHAR(80) NULL,
    `email` VARCHAR(120) NULL,
    `password_hash` VARCHAR(100) NULL,
    `is_guest` BOOLEAN NOT NULL DEFAULT true,
    `level` INTEGER NOT NULL DEFAULT 1,
    `total_xp` INTEGER NOT NULL DEFAULT 0,
    `streak_count` INTEGER NOT NULL DEFAULT 0,
    `last_active_date` DATE NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(60) NOT NULL,
    `name` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vocabulary_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(60) NOT NULL,
    `language_code` CHAR(5) NOT NULL DEFAULT 'en-US',
    `word` VARCHAR(60) NOT NULL,
    `phonetic` VARCHAR(80) NULL,
    `meaning_id` VARCHAR(120) NOT NULL,
    `example_sentence` VARCHAR(255) NULL,
    `image_url` VARCHAR(255) NULL,
    `category_id` INTEGER NOT NULL,
    `difficulty` TINYINT NOT NULL DEFAULT 1,
    `alternates` JSON NULL,

    UNIQUE INDEX `vocabulary_items_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vocabulary_relations` (
    `vocabulary_id` INTEGER NOT NULL,
    `related_vocabulary_id` INTEGER NOT NULL,
    `kind` ENUM('related', 'synonym', 'antonym') NOT NULL,

    PRIMARY KEY (`vocabulary_id`, `related_vocabulary_id`, `kind`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vocabulary_translations` (
    `vocabulary_id` INTEGER NOT NULL,
    `language_code` CHAR(5) NOT NULL,
    `translation` VARCHAR(120) NOT NULL,
    `romanization` VARCHAR(80) NULL,
    `source` VARCHAR(40) NOT NULL,
    `reviewed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`vocabulary_id`, `language_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vocabulary_sentences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vocabulary_id` INTEGER NOT NULL,
    `kind` ENUM('choice', 'cloze', 'order') NOT NULL,
    `sentence_en` VARCHAR(160) NOT NULL,
    `blank_word` VARCHAR(60) NULL,
    `words_json` JSON NULL,
    `difficulty` TINYINT NOT NULL DEFAULT 1,
    `source` VARCHAR(40) NOT NULL DEFAULT 'own',
    `source_ref` VARCHAR(40) NULL,
    `author` VARCHAR(80) NULL,
    `license` VARCHAR(40) NOT NULL DEFAULT 'own',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sentence_translations` (
    `sentence_id` INTEGER NOT NULL,
    `language_code` CHAR(5) NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `pinyin` VARCHAR(255) NULL,
    `source` VARCHAR(40) NOT NULL,
    `source_ref` VARCHAR(40) NULL,
    `author` VARCHAR(80) NULL,
    `license` VARCHAR(40) NOT NULL,
    `reviewed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`sentence_id`, `language_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detection_labels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vocabulary_id` INTEGER NOT NULL,
    `model` VARCHAR(20) NOT NULL,
    `label` VARCHAR(60) NOT NULL,
    `min_confidence` DECIMAL(3, 2) NOT NULL DEFAULT 0.60,

    UNIQUE INDEX `detection_labels_vocabulary_id_model_label_key`(`vocabulary_id`, `model`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `missions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(60) NOT NULL,
    `title_id` VARCHAR(160) NOT NULL,
    `hint_text` VARCHAR(160) NULL,
    `category_id` INTEGER NOT NULL,
    `difficulty` TINYINT NOT NULL DEFAULT 1,
    `scan_xp` INTEGER NOT NULL DEFAULT 50,
    `speak_xp` INTEGER NOT NULL DEFAULT 30,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `prerequisite_mission_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `exercise_plan` JSON NOT NULL,
    `practice_xp` INTEGER NOT NULL DEFAULT 30,

    UNIQUE INDEX `missions_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mission_targets` (
    `mission_id` INTEGER NOT NULL,
    `vocabulary_id` INTEGER NOT NULL,

    PRIMARY KEY (`mission_id`, `vocabulary_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mission_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `mission_id` INTEGER NOT NULL,
    `vocabulary_id` INTEGER NULL,
    `status` ENUM('started', 'scanned', 'completed', 'abandoned') NOT NULL DEFAULT 'started',
    `hint_count` INTEGER NOT NULL DEFAULT 0,
    `best_score` INTEGER NULL,
    `stars` TINYINT NULL,
    `xp_awarded` INTEGER NOT NULL DEFAULT 0,
    `started_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` DATETIME(0) NULL,
    `practice_accuracy` INTEGER NULL,
    `speak_score` INTEGER NULL,
    `session_score` INTEGER NULL,
    `result_json` JSON NULL,

    INDEX `idx_user_mission`(`user_id`, `mission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scan_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` CHAR(36) NOT NULL,
    `model` VARCHAR(20) NOT NULL,
    `label` VARCHAR(60) NOT NULL,
    `confidence` DECIMAL(5, 4) NOT NULL,
    `matched` BOOLEAN NOT NULL,
    `latency_ms` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pronunciation_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` CHAR(36) NOT NULL,
    `sentence_id` INTEGER NULL,
    `transcript` VARCHAR(255) NOT NULL,
    `confidence` DECIMAL(5, 4) NULL,
    `score` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exercise_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` CHAR(36) NOT NULL,
    `sentence_id` INTEGER NOT NULL,
    `kind` ENUM('choice', 'cloze', 'order') NOT NULL,
    `attempt_no` TINYINT NOT NULL,
    `answer` VARCHAR(255) NOT NULL,
    `is_correct` BOOLEAN NOT NULL,
    `value` DECIMAL(2, 1) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_attempt`(`session_id`, `sentence_id`, `attempt_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_vocabulary` (
    `user_id` CHAR(36) NOT NULL,
    `vocabulary_id` INTEGER NOT NULL,
    `first_collected_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `best_score` INTEGER NULL,
    `times_practiced` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`user_id`, `vocabulary_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `xp_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NOT NULL,
    `session_id` CHAR(36) NULL,
    `source` ENUM('welcome', 'scan', 'practice', 'speak') NOT NULL,
    `amount` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `xp_events_session_id_source_key`(`session_id`, `source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vocabulary_items` ADD CONSTRAINT `vocabulary_items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vocabulary_relations` ADD CONSTRAINT `vocabulary_relations_vocabulary_id_fkey` FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vocabulary_relations` ADD CONSTRAINT `vocabulary_relations_related_vocabulary_id_fkey` FOREIGN KEY (`related_vocabulary_id`) REFERENCES `vocabulary_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vocabulary_translations` ADD CONSTRAINT `vocabulary_translations_vocabulary_id_fkey` FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vocabulary_sentences` ADD CONSTRAINT `vocabulary_sentences_vocabulary_id_fkey` FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sentence_translations` ADD CONSTRAINT `sentence_translations_sentence_id_fkey` FOREIGN KEY (`sentence_id`) REFERENCES `vocabulary_sentences`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detection_labels` ADD CONSTRAINT `detection_labels_vocabulary_id_fkey` FOREIGN KEY (`vocabulary_id`) REFERENCES `vocabulary_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scan_attempts` ADD CONSTRAINT `scan_attempts_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `mission_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pronunciation_attempts` ADD CONSTRAINT `pronunciation_attempts_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `mission_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xp_events` ADD CONSTRAINT `xp_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `xp_events` ADD CONSTRAINT `xp_events_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `mission_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
