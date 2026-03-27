package com.almaeng.domain.completedbook.repository;

import com.almaeng.domain.completedbook.entity.CompletedBook;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompletedBookRepository extends JpaRepository<CompletedBook, Long> {
    interface GenreCountProjection {
        Long getGenreId();
        String getGenreName();
        Long getBookCount();
    }

    // 완독 도서 정렬 - 기준은 컨트롤러단에서 추가
    List<CompletedBook> findAllByUserId(Long userId, Sort sort);

    // 중복 확인
    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    // 삭제를 위한 완독 도서 찾기
    Optional<CompletedBook> findByUserIdAndBookId(Long userId, Long bookId);

    // 완독도서의 최상위 장르 찾기
    @Query("SELECT DISTINCT cb FROM CompletedBook cb " +
            "JOIN FETCH cb.book b " +
            "LEFT JOIN FETCH b.bookGenres bg " +
            "LEFT JOIN FETCH bg.genre g " +
            "LEFT JOIN FETCH g.parent " +
            "WHERE cb.user.id = :userId")
    List<CompletedBook> findAllByUserIdWithDetails(@Param("userId") Long userId, Sort sort);

    @Query("SELECT COUNT(cb) FROM CompletedBook cb WHERE cb.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    // 완독 도서의 상위 장르: book_genres 장르에서 parent를 따라 parent_id IS NULL인 루트까지 올려 집계
    @Query(value = """
            WITH RECURSIVE genre_climb AS (
                SELECT
                    cb.id AS completed_book_id,
                    g.id AS current_id,
                    g.parent_id,
                    g.genre_name AS current_name
                FROM user_completed_books cb
                JOIN book_genres bg ON cb.book_id = bg.book_id
                JOIN genres g ON bg.genre_id = g.id
                WHERE cb.user_id = :userId
                UNION ALL
                SELECT
                    gc.completed_book_id,
                    p.id,
                    p.parent_id,
                    p.genre_name
                FROM genre_climb gc
                JOIN genres p ON gc.parent_id = p.id
                WHERE gc.parent_id IS NOT NULL
            ),
            roots AS (
                SELECT completed_book_id, current_id AS root_id, current_name AS root_name
                FROM genre_climb
                WHERE parent_id IS NULL
            )
            SELECT
                root_id AS genreId,
                root_name AS genreName,
                COUNT(DISTINCT completed_book_id) AS bookCount
            FROM roots
            GROUP BY root_id, root_name
            ORDER BY bookCount DESC, genreName ASC
            """, nativeQuery = true)
    List<GenreCountProjection> aggregateTopLevelGenres(@Param("userId") Long userId);

    // 완독 도서(소설)의 하위 장르 가져오기
    @Query(value = """
            SELECT
                t.genreId AS genreId,
                t.genreName AS genreName,
                COUNT(DISTINCT t.completedBookId) AS bookCount
            FROM (
                SELECT
                    cb.id AS completedBookId,
                    CASE
                        WHEN parent.id = :topLevelGenreId THEN g.id
                        WHEN grandParent.id = :topLevelGenreId THEN parent.id
                    END AS genreId,
                    CASE
                        WHEN parent.id = :topLevelGenreId THEN g.genre_name
                        WHEN grandParent.id = :topLevelGenreId THEN parent.genre_name
                    END AS genreName
                FROM user_completed_books cb
                JOIN book_genres bg ON cb.book_id = bg.book_id
                JOIN genres g ON bg.genre_id = g.id
                LEFT JOIN genres parent ON g.parent_id = parent.id
                LEFT JOIN genres grandParent ON parent.parent_id = grandParent.id
                WHERE cb.user_id = :userId
                  AND (parent.id = :topLevelGenreId OR grandParent.id = :topLevelGenreId)
            ) t
            WHERE t.genreId IS NOT NULL AND t.genreName IS NOT NULL
            GROUP BY t.genreId, t.genreName
            ORDER BY bookCount DESC, t.genreName ASC
            """, nativeQuery = true)
    List<GenreCountProjection> aggregateSubGenresByTopLevelGenre(
            @Param("userId") Long userId,
            @Param("topLevelGenreId") Long topLevelGenreId
    );
}
