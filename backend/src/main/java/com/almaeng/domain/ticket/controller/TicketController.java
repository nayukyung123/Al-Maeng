package com.almaeng.domain.ticket.controller;

import com.almaeng.domain.ticket.dto.TicketCreateRequest;
import com.almaeng.domain.ticket.dto.TicketCreateResponse;
import com.almaeng.domain.ticket.dto.TicketResponse;
import com.almaeng.domain.ticket.service.TicketService;
import com.almaeng.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {
    private final TicketService ticketService;

    // 완독 티켓 생성
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TicketCreateResponse> createTicket(@RequestParam Long userId,
                                                          @Valid @RequestBody TicketCreateRequest request) {
        Long savedTicketId = ticketService.createTicket(userId, request);
        TicketCreateResponse response = new TicketCreateResponse(savedTicketId);

        return ApiResponse.success(response);
    }

    // 완독 티켓 삭제
    @DeleteMapping("/{ticketId}")
    public ApiResponse<Void> deleteTicket(@RequestParam Long userId,
                                          @PathVariable Long ticketId) {
        ticketService.deleteTicket(userId, ticketId);

        return ApiResponse.success();
    }

    // 완독 티켓 상세 조회
    @GetMapping("/{ticketId}")
    public ApiResponse<TicketResponse> getTicketDetail(@RequestParam Long userId,
                                                       @PathVariable Long ticketId) {
        TicketResponse response = ticketService.getTicketDetail(userId, ticketId);

        return ApiResponse.success(response);
    }

    // 완독 티켓 갤러리 조회
    @GetMapping("/gallery")
    public ApiResponse<List<TicketResponse>> getGalleryTickets(@RequestParam Long userId) {
        List<TicketResponse> response = ticketService.getGalleryTickets(userId);

        return ApiResponse.success(response);
    }
}
