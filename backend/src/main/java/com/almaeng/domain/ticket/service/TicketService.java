package com.almaeng.domain.ticket.service;

import com.almaeng.domain.completedbook.entity.CompletedBook;
import com.almaeng.domain.completedbook.repository.CompletedBookRepository;
import com.almaeng.domain.genre.entity.Genre;
import com.almaeng.domain.genre.repository.GenreRepository;
import com.almaeng.domain.ticket.dto.PresignedUrlResponse;
import com.almaeng.domain.ticket.dto.TicketCreateRequest;
import com.almaeng.domain.ticket.dto.TicketResponse;
import com.almaeng.domain.ticket.entity.Ticket;
import com.almaeng.domain.ticket.repository.TicketRepository;
import com.almaeng.global.error.ApiException;
import com.almaeng.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {
    private final TicketRepository ticketRepository;
    private final CompletedBookRepository completedBookRepository;
    private final GenreRepository genreRepository;
    private final S3Presigner s3Presigner;

    @Value("${cloud.aws.s3.bucket}")
    private String bucketName;
    @Value("${cloud.aws.region.static}")
    private String region;

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

    // 완독 티켓 상세 조회
    @Transactional(readOnly = true)
    public TicketResponse getTicketDetail(Long userId, Long ticketId) {
        Ticket ticket = ticketRepository.findByIdWithDetails(ticketId)
                .orElseThrow(() -> new ApiException(ErrorCode.TICKET_NOT_FOUND));

        if (!ticket.getCompletedBook().getUser().getId().equals(userId)) {
            throw new ApiException(ErrorCode.TICKET_ACCESS_DENIED);
        }

        return TicketResponse.from(ticket);
    }

    // 완독 티켓 갤러리 조회
    @Transactional(readOnly = true)
    public List<TicketResponse> getGalleryTickets(Long userId) {
        PageRequest pageRequest = PageRequest.of(0, 7);

        List<Ticket> tickets = ticketRepository.findGalleryTickets(userId, pageRequest);

        return tickets.stream()
                .map(TicketResponse::from)
                .toList();
    }

    // 완독 티켓 바인더 조회 - 장르 필터, 4개씩 페이징
    @Transactional(readOnly = true)
    public Page<TicketResponse> getBinderTickets(Long userId, String genreName, int page) {
        Pageable pageable = PageRequest.of(page, 4, Sort.by(Sort.Direction.DESC, "completedBook.completedAt"));

        if (genreName == null || genreName.trim().isEmpty()) {
            return ticketRepository.findBinderTicketsAll(userId, pageable)
                    .map(TicketResponse::from);
        }

        Genre targetGenre = genreRepository.findByNameWithChildren(genreName)
                .orElseThrow(() -> new ApiException(ErrorCode.GENRE_NOT_FOUND));

        List<Long> targetGenreIds = new ArrayList<>();
        targetGenreIds.add(targetGenre.getId());
        targetGenre.getChildren().forEach(child -> targetGenreIds.add(child.getId()));

        Page<Ticket> ticketPage = ticketRepository.findBinderTicketsByGenreIds(userId, targetGenreIds, pageable);

        return ticketPage.map(TicketResponse::from);
    }

    // S3 이미지 저장용 url 발급
    public PresignedUrlResponse getPresignedUrl(Long userId, String fileExtension) {
        String fileName = "users/" + userId + "/tickets/" + UUID.randomUUID() + "." + fileExtension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType("image/" + fileExtension)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        String presignedUrl = presignedRequest.url().toString();

        String imageUrl = "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + fileName;

        return new PresignedUrlResponse(presignedUrl, imageUrl);
    }
}
