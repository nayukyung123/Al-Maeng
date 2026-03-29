-- 1. 새로운 티어 시스템으로 갱신 (UPSERT)
-- 기존에 있던 1~5번은 덮어쓰고, 6~10번은 새로 추가
INSERT INTO tiers (id, tier_name, min_exp) VALUES
                                               (1, 'IRON', 0),
                                               (2, 'BRONZE', 3),
                                               (3, 'SILVER', 7),
                                               (4, 'GOLD', 15),
                                               (5, 'PLATINUM', 25),
                                               (6, 'EMERALD', 40),
                                               (7, 'DIAMOND', 60),
                                               (8, 'MASTER', 90),
                                               (9, 'GRANDMASTER', 130),
                                               (10, 'CHALLENGER', 200)
ON CONFLICT (id) DO UPDATE
    SET tier_name = EXCLUDED.tier_name,
        min_exp = EXCLUDED.min_exp;

-- 2. 기존 유저들의 완독 권수(completed_count) 및 티어(tier_id) 일괄 동기화
-- 앞서 업데이트된 새로운 tiers 기준을 바탕으로 각 유저의 데이터를 최신화
UPDATE users u
SET
    -- 완독 권수 동기화
    completed_count = (
        SELECT COUNT(*)
        FROM user_completed_books ucb
        WHERE ucb.user_id = u.id
    ),
    -- 완독 권수에 맞는 새로운 티어 ID 동기화
    tier_id = (
        SELECT t.id
        FROM tiers t
        WHERE t.min_exp <= (
            SELECT COUNT(*)
            FROM user_completed_books ucb
            WHERE ucb.user_id = u.id
        )
        ORDER BY t.min_exp DESC
        LIMIT 1
    );