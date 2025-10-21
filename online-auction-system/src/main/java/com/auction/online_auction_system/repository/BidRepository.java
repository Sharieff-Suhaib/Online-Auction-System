package com.auction.online_auction_system.repository;

import com.auction.online_auction_system.entity.Auction;
import com.auction.online_auction_system.entity.Bid;
import com.auction.online_auction_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {

    List<Bid> findByAuctionOrderByBidAmountDesc(Auction auction);

    List<Bid> findByUserOrderByBidTimeDesc(User user);

    @Query("SELECT b FROM Bid b WHERE b.auction = :auction ORDER BY b.bidAmount DESC LIMIT 1")
    Optional<Bid> findHighestBidForAuction(@Param("auction") Auction auction);

    @Query(value = "SELECT COUNT(*) FROM bids WHERE auction_id = :auctionId", nativeQuery = true)
    long countByAuction(@Param("auctionId") Long auctionId);

    boolean existsByAuctionAndUser(Auction auction, User user);

    @Query("SELECT b FROM Bid b WHERE b.auction.id = :auctionId ORDER BY b.bidTime DESC")
    List<Bid> findRecentBidsByAuction(@Param("auctionId") Long auctionId);
}