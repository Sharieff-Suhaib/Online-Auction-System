package com.auction.online_auction_system.repository;

import com.auction.online_auction_system.entity.Auction;
import com.auction.online_auction_system.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {

    List<Auction> findByStatus(Auction.AuctionStatus status);

    Optional<Auction> findByProductAndStatus(Product product, Auction.AuctionStatus status);

    @Query("SELECT a FROM Auction a WHERE a.status = 'SCHEDULED' AND a.startTime <= :now")
    List<Auction> findAuctionsToStart(@Param("now") LocalDateTime now);

    @Query("SELECT a FROM Auction a WHERE a.status = 'LIVE' AND a.endTime <= :now")
    List<Auction> findAuctionsToEnd(@Param("now") LocalDateTime now);

    List<Auction> findByProduct(Product product);

    @Query("SELECT a FROM Auction a WHERE a.status = 'LIVE' ORDER BY a.endTime ASC")
    List<Auction> findAllLiveAuctions();

    @Query("SELECT a FROM Auction a WHERE a.status = 'COMPLETED' ORDER BY a.endTime DESC")
    List<Auction> findAllCompletedAuctions();
}