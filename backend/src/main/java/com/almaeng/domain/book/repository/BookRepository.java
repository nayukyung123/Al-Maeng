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

    // 고도화 때 ElasticSearch 도입 고려 중
    List<Book> findTop5ByTitleContainingOrAuthorContaining(String title, String author);

    Slice<Book> findByTitleContainingOrAuthorContaining(String title, String author, Pageable pageable);

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
}
