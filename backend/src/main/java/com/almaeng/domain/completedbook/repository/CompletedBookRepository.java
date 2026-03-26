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

    // 완독 도서의 상위 장르 가져오기
    @Query(value = """
            SELECT
                COALESCE(parent.id, g.id) AS genreId,
                COALESCE(parent.genre_name, g.genre_name) AS genreName,
                COUNT(*) AS bookCount
            FROM user_completed_books cb
            JOIN book_genres bg ON cb.book_id = bg.book_id
            JOIN genres g ON bg.genre_id = g.id
            LEFT JOIN genres parent ON g.parent_id = parent.id
            WHERE cb.user_id = :userId
            GROUP BY COALESCE(parent.id, g.id), COALESCE(parent.genre_name, g.genre_name)
            ORDER BY bookCount DESC, genreName ASC
            """, nativeQuery = true)
    List<GenreCountProjection> aggregateTopLevelGenres(@Param("userId") Long userId);

    // 완독 도서(소설)의 하위 장르 가져오기
    @Query(value = """
            SELECT
                t.genreId AS genreId,
                t.genreName AS genreName,
                COUNT(*) AS bookCount
            FROM (
                SELECT
                    CASE
                        WHEN parent.genre_name = :topLevelGenreName THEN g.id
                        WHEN grandParent.genre_name = :topLevelGenreName THEN parent.id
                    END AS genreId,
                    CASE
                        WHEN parent.genre_name = :topLevelGenreName THEN g.genre_name
                        WHEN grandParent.genre_name = :topLevelGenreName THEN parent.genre_name
                    END AS genreName
                FROM user_completed_books cb
                JOIN book_genres bg ON cb.book_id = bg.book_id
                JOIN genres g ON bg.genre_id = g.id
                LEFT JOIN genres parent ON g.parent_id = parent.id
                LEFT JOIN genres grandParent ON parent.parent_id = grandParent.id
                WHERE cb.user_id = :userId
                  AND (parent.genre_name = :topLevelGenreName OR grandParent.genre_name = :topLevelGenreName)
            ) t
            WHERE t.genreId IS NOT NULL AND t.genreName IS NOT NULL
            GROUP BY t.genreId, t.genreName
            ORDER BY bookCount DESC, t.genreName ASC
            """, nativeQuery = true)
    List<GenreCountProjection> aggregateSubGenresByTopLevelGenre(
            @Param("userId") Long userId,
            @Param("topLevelGenreName") String topLevelGenreName
    );
}
