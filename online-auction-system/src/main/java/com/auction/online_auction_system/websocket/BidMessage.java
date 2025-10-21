package com.auction.online_auction_system.websocket;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BidMessage {
    private Long auctionId;
    private Long userId;
    private String username;
    private BigDecimal bidAmount;
    private LocalDateTime timestamp;
    private String messageType = "BID_PLACED";
}