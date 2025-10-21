package com.auction.online_auction_system.dto;

import com.auction.online_auction_system.entity.Bid;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.DecimalMin;
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
public class BidDTO {

    private Long id;

    @NotNull(message = "Auction ID is required")
    private Long auctionId;

    private Long userId;
    private String username;

    @NotNull(message = "Bid amount is required")
    @DecimalMin(value = "0.01", message = "Bid amount must be greater than 0")
    private BigDecimal bidAmount;

    private Boolean isWinning;
    private LocalDateTime bidTime;
    private String ipAddress;

    public static BidDTO fromEntity(Bid bid) {
        return BidDTO.builder()
                .id(bid.getId())
                .auctionId(bid.getAuction().getId())
                .userId(bid.getUser().getId())
                .username(bid.getUser().getUsername())
                .bidAmount(bid.getBidAmount())
                .isWinning(bid.getIsWinning())
                .bidTime(bid.getBidTime())
                .ipAddress(bid.getIpAddress())
                .build();
    }
}