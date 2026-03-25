package com.almaeng.domain.book.repository;

import com.almaeng.domain.book.entity.Book;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findBySlug(String slug); // URL 식별자인 slug로 조회
    
    // 전체 인기 도서 - 완독순
    @Query(value = "SELECT b.* FROM books b JOIN user_completed_books c ON b.id = c.book_id " +
            "GROUP BY b.id ORDER BY COUNT(c.id) DESC, b.id DESC LIMIT 5", nativeQuery = true)
    List<Book> findTop5ByCompletedAllTime();

    // 주간 인기 도서 - 완독순
    @Query(value = "SELECT b.* FROM books b JOIN user_completed_books c ON b.id = c.book_id " +
            "WHERE c.created_at >= :startDate " +
            "GROUP BY b.id ORDER BY COUNT(c.id) DESC, b.id DESC LIMIT 5", nativeQuery = true)
    List<Book> findTop5ByCompletedWeekly(@Param("startDate") LocalDateTime startDate);

    // 전체 인기 도서 - 찜한순
    @Query(value = "SELECT b.* FROM books b JOIN user_wishlist w ON b.id = w.book_id " +
            "GROUP BY b.id ORDER BY COUNT(w.id) DESC, b.id DESC LIMIT 5", nativeQuery = true)
    List<Book> findTop5ByFavoriteAllTime();

    // 주간 인기 도서 - 찜한순
    @Query(value = "SELECT b.* FROM books b JOIN user_wishlist w ON b.id = w.book_id " +
            "WHERE w.created_at >= :startDate " +
            "GROUP BY b.id ORDER BY COUNT(w.id) DESC, b.id DESC LIMIT 5", nativeQuery = true)
    List<Book> findTop5ByFavoriteWeekly(@Param("startDate") LocalDateTime startDate);
    
    // 전체 인기 도서 - 조회순
    @Query(value = "SELECT b.* FROM books b JOIN click_log c ON b.id = c.book_id " +
            "GROUP BY b.id ORDER BY COUNT(c.id) DESC, b.id DESC LIMIT 5", nativeQuery = true)
    List<Book> findTop5ByViewAllTime();

    // 주간 인기 도서 - 조회순
    @Query(value = "SELECT b.* FROM books b JOIN click_log c ON b.id = c.book_id " +
            "WHERE c.created_at >= :startDate " +
            "GROUP BY b.id ORDER BY COUNT(c.id) DESC, b.id DESC LIMIT 5", nativeQuery = true)
    List<Book> findTop5ByViewWeekly(@Param("startDate") LocalDateTime startDate);

    // 검색 자동완성 (정확도 + 평점)
    @Query("SELECT b FROM Book b " +
            "WHERE LOWER(REPLACE(b.title, ' ', '')) LIKE CONCAT('%', :keyword, '%') " +
            "   OR LOWER(REPLACE(b.author, ' ', '')) LIKE CONCAT('%', :keyword, '%') " +
            "ORDER BY " +
            "  CASE WHEN LOWER(REPLACE(b.title, ' ', '')) = :keyword THEN 1 " + // 완전 일치
            "       WHEN LOWER(REPLACE(b.title, ' ', '')) LIKE CONCAT(:keyword, '%') THEN 2 " + // 전방 일치
            "       ELSE 3 END ASC, " + // 부분 일치
            "  b.averageRating DESC, b.id DESC")
    List<Book> findSuggestionsByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // 검색 결과 (띄어쓰기 무시 + 동적 정렬)
    @Query("SELECT b FROM Book b " +
            "WHERE LOWER(REPLACE(b.title, ' ', '')) LIKE CONCAT('%', :keyword, '%') " +
            "   OR LOWER(REPLACE(b.author, ' ', '')) LIKE CONCAT('%', :keyword, '%') " +
            "ORDER BY " +
            "  CASE WHEN :sortType = 'accuracy' THEN " +
            "       CASE WHEN LOWER(REPLACE(b.title, ' ', '')) = :keyword THEN 1 " +
            "            WHEN LOWER(REPLACE(b.title, ' ', '')) LIKE CONCAT(:keyword, '%') THEN 2 " +
            "            ELSE 3 END " +
            "  END ASC, " +
            "  CASE WHEN :sortType = 'latest' THEN b.publishedDate END DESC, " +
            "  CASE WHEN :sortType = 'rating' THEN b.averageRating END DESC, " +
            "  b.id DESC")
    Slice<Book> searchBooksByKeyword(@Param("keyword") String keyword, @Param("sortType") String sortType, Pageable pageable);
}
