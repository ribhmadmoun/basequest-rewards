-- Link X (Twitter) accounts to BaseQuest users for Community Quests.
alter table users add column if not exists x_user_id text;
alter table users add column if not exists x_username text;
