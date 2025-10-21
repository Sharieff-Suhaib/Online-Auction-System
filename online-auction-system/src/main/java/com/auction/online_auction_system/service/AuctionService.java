package com.auction.online_auction_system.service;

import com.auction.online_auction_system.dto.AuctionDTO;
import com.auction.online_auction_system.entity.Auction;
import com.auction.online_auction_system.entity.Bid;
import com.auction.online_auction_system.entity.Product;
import com.auction.online_auction_system.exception.AuctionException;
import com.auction.online_auction_system.repository.AuctionRepository;
import com.auction.online_auction_system.repository.BidRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final ProductService productService;

    public AuctionDTO createAuction(AuctionDTO auctionDTO) {
        log.info("Creating new auction for product ID: {}", auctionDTO.getProductId());
        Product product = productService.getProductEntityById(auctionDTO.getProductId());

        if (auctionDTO.getEndTime().isBefore(auctionDTO.getStartTime())) {
            throw new AuctionException("End time must be after start time");
        }

        Auction auction = new Auction();
        auction.setProduct(product);
        auction.setStartTime(auctionDTO.getStartTime());
        auction.setEndTime(auctionDTO.getEndTime());
        auction.setCurrentBid(product.getStartingPrice());
        auction.setMinimumIncrement(auctionDTO.getMinimumIncrement() != null ?
                auctionDTO.getMinimumIncrement() : auction.getMinimumIncrement());
        auction.setStatus(Auction.AuctionStatus.SCHEDULED);

        product.setStatus(Product.ProductStatus.IN_AUCTION);

        Auction savedAuction = auctionRepository.save(auction);
        log.info("Auction created successfully with ID: {}", savedAuction.getId());

        return AuctionDTO.fromEntity(savedAuction);
    }

    @Transactional(readOnly = true)
    public AuctionDTO getAuctionById(Long id) {
        log.debug("Fetching auction by ID: {}", id);
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AuctionException("Auction not found with id: " + id));
        return AuctionDTO.fromEntity(auction);
    }

    @Transactional(readOnly = true)
    public List<AuctionDTO> getAllAuctions() {
        log.debug("Fetching all auctions");
        return auctionRepository.findAll().stream()
                .map(AuctionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuctionDTO> getAuctionsByStatus(Auction.AuctionStatus status) {
        log.debug("Fetching auctions by status: {}", status);
        return auctionRepository.findByStatus(status).stream()
                .map(AuctionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuctionDTO> getLiveAuctions() {
        log.debug("Fetching live auctions");
        return auctionRepository.findAllLiveAuctions().stream()
                .map(AuctionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Scheduled(fixedRate = 10000)
    public void startScheduledAuctions() {
        LocalDateTime now = LocalDateTime.now();
        List<Auction> auctionsToStart = auctionRepository.findAuctionsToStart(now);

        for (Auction auction : auctionsToStart) {
            auction.setStatus(Auction.AuctionStatus.LIVE);
            auctionRepository.save(auction);
            log.info("✅ Started auction ID: {}", auction.getId());
        }
    }

    @Scheduled(fixedRate = 10000)
    public void endLiveAuctions() {
        LocalDateTime now = LocalDateTime.now();
        List<Auction> auctionsToEnd = auctionRepository.findAuctionsToEnd(now);

        for (Auction auction : auctionsToEnd) {
            completeAuction(auction);
        }
    }

    private void completeAuction(Auction auction) {
        auction.setStatus(Auction.AuctionStatus.COMPLETED);

        Optional<Bid> highestBid = bidRepository.findHighestBidForAuction(auction);

        if (highestBid.isPresent()) {
            Bid winningBid = highestBid.get();
            auction.setWinner(winningBid.getUser());
            auction.setWinningBid(winningBid.getBidAmount());
            winningBid.setIsWinning(true);
            auction.getProduct().setStatus(Product.ProductStatus.SOLD);
            log.info("🏆 Auction ID {} won by user: {} with bid: ${}",
                    auction.getId(), winningBid.getUser().getUsername(), winningBid.getBidAmount());
        } else {
            auction.getProduct().setStatus(Product.ProductStatus.AVAILABLE);
            log.info("⚠️ Auction ID {} completed with no bids", auction.getId());
        }

        auctionRepository.save(auction);
    }

    public void cancelAuction(Long id) {
        log.info("Cancelling auction: {}", id);
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AuctionException("Auction not found with id: " + id));

        if (auction.getStatus() == Auction.AuctionStatus.COMPLETED) {
            throw new AuctionException("Cannot cancel completed auction");
        }

        auction.setStatus(Auction.AuctionStatus.CANCELLED);
        auction.getProduct().setStatus(Product.ProductStatus.AVAILABLE);
        auctionRepository.save(auction);
        log.info("Auction cancelled: {}", id);
    }

    public Auction getAuctionEntityById(Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new AuctionException("Auction not found with id: " + id));
    }
}