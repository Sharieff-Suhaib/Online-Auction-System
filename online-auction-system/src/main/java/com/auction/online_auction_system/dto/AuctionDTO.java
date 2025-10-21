package com.auction.online_auction_system.dto;

import com.auction.online_auction_system.entity.Auction;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuctionDTO {

    private Long id;

    @NotNull(message = "Product ID is required")
    private Long productId;

    private String productName;
    private String productImageUrl;
    private String productDescription;

    @NotNull(message = "Start time is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endTime;

    private BigDecimal currentBid;
    private BigDecimal minimumIncrement;
    private Long winnerId;
    private String winnerName;
    private BigDecimal winningBid;
    private Auction.AuctionStatus status;
    private int totalBids;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    public static AuctionDTO fromEntity(Auction auction) {
        AuctionDTO.AuctionDTOBuilder builder = AuctionDTO.builder()
                .id(auction.getId())
                .productId(auction.getProduct().getId())
                .productName(auction.getProduct().getName())
                .productImageUrl(auction.getProduct().getImageUrl())
                .productDescription(auction.getProduct().getDescription())
                .startTime(auction.getStartTime())
                .endTime(auction.getEndTime())
                .currentBid(auction.getCurrentBid())
                .minimumIncrement(auction.getMinimumIncrement())
                .winningBid(auction.getWinningBid())
                .status(auction.getStatus())
                .totalBids(auction.getBids().size())
                .createdAt(auction.getCreatedAt());

        if (auction.getWinner() != null) {
            builder.winnerId(auction.getWinner().getId())
                    .winnerName(auction.getWinner().getUsername());
        }

        return builder.build();
    }
}