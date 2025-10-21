package com.auction.online_auction_system.controller;

import com.auction.online_auction_system.dto.AuctionDTO;
import com.auction.online_auction_system.entity.Auction;
import com.auction.online_auction_system.service.AuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuctionController {

    private final AuctionService auctionService;

    @PostMapping
    public ResponseEntity<AuctionDTO> createAuction(@Valid @RequestBody AuctionDTO auctionDTO) {
        AuctionDTO createdAuction = auctionService.createAuction(auctionDTO);
        return new ResponseEntity<>(createdAuction, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuctionDTO> getAuctionById(@PathVariable Long id) {
        AuctionDTO auction = auctionService.getAuctionById(id);
        return ResponseEntity.ok(auction);
    }

    @GetMapping
    public ResponseEntity<List<AuctionDTO>> getAllAuctions() {
        List<AuctionDTO> auctions = auctionService.getAllAuctions();
        return ResponseEntity.ok(auctions);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<AuctionDTO>> getAuctionsByStatus(@PathVariable Auction.AuctionStatus status) {
        List<AuctionDTO> auctions = auctionService.getAuctionsByStatus(status);
        return ResponseEntity.ok(auctions);
    }

    @GetMapping("/live")
    public ResponseEntity<List<AuctionDTO>> getLiveAuctions() {
        List<AuctionDTO> auctions = auctionService.getLiveAuctions();
        return ResponseEntity.ok(auctions);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelAuction(@PathVariable Long id) {
        auctionService.cancelAuction(id);
        return ResponseEntity.noContent().build();
    }
}