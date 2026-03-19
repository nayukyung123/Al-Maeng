package com.almaeng.domain.ticket.repository;

import com.almaeng.domain.ticket.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket,Long> {
    // 중복 티켓 생성 방지
    boolean existsByCompletedBookId(Long completedBookId);

    // 상세 조회
    @Query("SELECT t FROM Ticket t " +
            "JOIN FETCH t.completedBook cb " +
            "JOIN FETCH cb.book " +
            "WHERE t.id = :ticketId")
    Optional<Ticket> findByIdWithDetails(@Param("ticketId") Long ticketId);

    // 갤러리 조회: 완독일자 최신순으로 조회
    @Query("SELECT t FROM Ticket t " +
            "JOIN FETCH t.completedBook cb " +
            "JOIN FETCH cb.book " +
            "WHERE cb.user.id = :userId " +
            "ORDER BY cb.completedAt DESC")
    List<Ticket> findGalleryTickets(@Param("userId") Long userId, Pageable pageable);

    // 바인더 전체 조회
    @Query("SELECT t FROM Ticket t " +
            "JOIN FETCH t.completedBook cb " +
            "JOIN FETCH cb.book b " +
            "WHERE cb.user.id = :userId")
    Page<Ticket> findBinderTicketsAll(@Param("userId") Long userId, Pageable pageable);

    // 바인더 장르별 조회
    @Query("SELECT t FROM Ticket t " +
            "JOIN FETCH t.completedBook cb " +
            "JOIN FETCH cb.book b " +
            "JOIN FETCH b.bookGenres bg " +
            "WHERE cb.user.id = :userId AND bg.genre.id IN :genreIds")
    Page<Ticket> findBinderTicketsByGenreIds(@Param("userId") Long  userId,
                                             @Param("genreIds") List<Long> genreIds,
                                             Pageable pageable);
}
