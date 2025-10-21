package com.auction.online_auction_system.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "bids", indexes = {
        @Index(name = "idx_bid_auction", columnList = "auction_id"),
        @Index(name = "idx_bid_user", columnList = "user_id"),
        @Index(name = "idx_bid_amount", columnList = "bid_amount"),
        @Index(name = "idx_bid_time", columnList = "bid_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false, foreignKey = @ForeignKey(name = "fk_bid_auction"))
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_bid_user"))
    private User user;

    @Column(name = "bid_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal bidAmount;

    @Column(name = "is_winning", nullable = false)
    private Boolean isWinning = false;

    @CreationTimestamp
    @Column(name = "bid_time", nullable = false, updatable = false)
    private LocalDateTime bidTime;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;
}
