package com.auction.online_auction_system.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "auctions", indexes = {
        @Index(name = "idx_auction_status", columnList = "status"),
        @Index(name = "idx_auction_start_time", columnList = "start_time"),
        @Index(name = "idx_auction_end_time", columnList = "end_time"),
        @Index(name = "idx_auction_product", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_auction_product"))
    private Product product;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "current_bid", precision = 10, scale = 2)
    private BigDecimal currentBid;

    @Column(name = "minimum_increment", nullable = false, precision = 10, scale = 2)
    private BigDecimal minimumIncrement = BigDecimal.valueOf(10.00);

    @OneToMany(mappedBy = "auction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Bid> bids = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id", foreignKey = @ForeignKey(name = "fk_auction_winner"))
    private User winner;

    @Column(name = "winning_bid", precision = 10, scale = 2)
    private BigDecimal winningBid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuctionStatus status = AuctionStatus.SCHEDULED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AuctionStatus {
        SCHEDULED, LIVE, COMPLETED, CANCELLED
    }
}
