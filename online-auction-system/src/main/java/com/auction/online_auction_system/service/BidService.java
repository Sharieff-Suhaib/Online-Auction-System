package com.auction.online_auction_system.service;

import com.auction.online_auction_system.dto.BidDTO;
import com.auction.online_auction_system.entity.Auction;
import com.auction.online_auction_system.entity.Bid;
import com.auction.online_auction_system.entity.User;
import com.auction.online_auction_system.exception.AuctionException;
import com.auction.online_auction_system.repository.BidRepository;
import com.auction.online_auction_system.websocket.BidMessage;
import com.auction.online_auction_system.websocket.WebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BidService {

    private final BidRepository bidRepository;
    private final AuctionService auctionService;
    private final UserService userService;
    private final WebSocketHandler webSocketHandler;

    public BidDTO placeBid(BidDTO bidDTO) {
        log.info("Placing bid for auction ID: {} by user ID: {}", bidDTO.getAuctionId(), bidDTO.getUserId());

        Auction auction = auctionService.getAuctionEntityById(bidDTO.getAuctionId());
        User user = userService.getUserEntityById(bidDTO.getUserId());

        if (auction.getStatus() != Auction.AuctionStatus.LIVE) {
            throw new AuctionException("Auction is not live. Current status: " + auction.getStatus());
        }

        BigDecimal minimumBid = auction.getCurrentBid().add(auction.getMinimumIncrement());
        if (bidDTO.getBidAmount().compareTo(minimumBid) < 0) {
            throw new AuctionException("Bid must be at least $" + minimumBid);
        }

        List<Bid> previousBids = bidRepository.findByAuctionOrderByBidAmountDesc(auction);
        previousBids.forEach(bid -> bid.setIsWinning(false));

        Bid bid = new Bid();
        bid.setAuction(auction);
        bid.setUser(user);
        bid.setBidAmount(bidDTO.getBidAmount());
        bid.setIsWinning(true);
        bid.setIpAddress(bidDTO.getIpAddress());

        Bid savedBid = bidRepository.save(bid);

        auction.setCurrentBid(bidDTO.getBidAmount());

        BidMessage message = new BidMessage();
        message.setAuctionId(auction.getId());
        message.setUserId(user.getId());
        message.setUsername(user.getUsername());
        message.setBidAmount(bidDTO.getBidAmount());
        message.setTimestamp(savedBid.getBidTime());

        webSocketHandler.broadcastBid(message);

        log.info("✅ Bid placed successfully: ${} by {}", bidDTO.getBidAmount(), user.getUsername());

        return BidDTO.fromEntity(savedBid);
    }

    @Transactional(readOnly = true)
    public List<BidDTO> getBidsByAuction(Long auctionId) {
        log.debug("Fetching bids for auction ID: {}", auctionId);
        Auction auction = auctionService.getAuctionEntityById(auctionId);
        return bidRepository.findByAuctionOrderByBidAmountDesc(auction).stream()
                .map(BidDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BidDTO> getBidsByUser(Long userId) {
        log.debug("Fetching bids for user ID: {}", userId);
        User user = userService.getUserEntityById(userId);
        return bidRepository.findByUserOrderByBidTimeDesc(user).stream()
                .map(BidDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BidDTO getHighestBid(Long auctionId) {
        log.debug("Fetching highest bid for auction ID: {}", auctionId);
        Auction auction = auctionService.getAuctionEntityById(auctionId);
        Bid highestBid = bidRepository.findHighestBidForAuction(auction)
                .orElseThrow(() -> new AuctionException("No bids found for this auction"));
        return BidDTO.fromEntity(highestBid);
    }

    @Transactional(readOnly = true)
    public long getBidCount(Long auctionId) {
        log.debug("Counting bids for auction ID: {}", auctionId);
        return bidRepository.countByAuction(auctionId);
    }
}