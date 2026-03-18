package com.almaeng.domain.ticket.service;

import com.almaeng.domain.completedbook.entity.CompletedBook;
import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.ticket.dto.TicketCreateRequest;
import com.almaeng.domain.ticket.entity.Ticket;
import com.almaeng.domain.ticket.repository.TicketRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketService {
    private final TicketRepository ticketRepository;
    private final CompletedBookRepository completedBookRepository;

    // 완독 티켓 생성
    @Transactional
    public Long createTicket(Long userId, TicketCreateRequest request) {
        CompletedBook completedBook = completedBookRepository.findByUserIdAndBookId(userId, request.bookId())
                .orElseThrow(() -> new ApiException(ErrorCode.COMPLETED_BOOK_NOT_FOUND));

        if (ticketRepository.existsByCompletedBookId(completedBook.getId())) {
            throw new ApiException(ErrorCode.TICKET_ALREADY_EXIST);
        }

        completedBook.updateCompletedAt(request.completedAt());

        Ticket ticket = Ticket.builder()
                .completedBook(completedBook)
                .comment(request.comment())
                .ticketImageUrl(request.ticketImageUrl())
                .build();

        return ticketRepository.save(ticket).getId();
    }

    // 완독 티켓 삭제
    @Transactional
    public void deleteTicket(Long userId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ApiException(ErrorCode.TICKET_NOT_FOUND));

        Long ownerId = ticket.getCompletedBook().getUser().getId();
        if (!ownerId.equals(userId)) {
            throw new ApiException(ErrorCode.TICKET_ACCESS_DENIED);
        }

        // S3 저장 로직 추가 이후 - db에서 티켓 삭제 이전에 실제 이미지 파일도 S3에서 삭제하는 로직 추가

        ticketRepository.delete(ticket);
    }
}
