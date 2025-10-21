package com.auction.online_auction_system.controller;

import com.auction.online_auction_system.dto.BidDTO;
import com.auction.online_auction_system.service.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/bids")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BidController {

    private final BidService bidService;

    @PostMapping
    public ResponseEntity<BidDTO> placeBid(@Valid @RequestBody BidDTO bidDTO) {
        BidDTO createdBid = bidService.placeBid(bidDTO);
        return new ResponseEntity<>(createdBid, HttpStatus.CREATED);
    }

    @GetMapping("/auction/{auctionId}")
    public ResponseEntity<List<BidDTO>> getBidsByAuction(@PathVariable Long auctionId) {
        List<BidDTO> bids = bidService.getBidsByAuction(auctionId);
        return ResponseEntity.ok(bids);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BidDTO>> getBidsByUser(@PathVariable Long userId) {
        List<BidDTO> bids = bidService.getBidsByUser(userId);
        return ResponseEntity.ok(bids);
    }

    @GetMapping("/auction/{auctionId}/highest")
    public ResponseEntity<BidDTO> getHighestBid(@PathVariable Long auctionId) {
        BidDTO bid = bidService.getHighestBid(auctionId);
        return ResponseEntity.ok(bid);
    }

    @GetMapping("/auction/{auctionId}/count")
    public ResponseEntity<Long> getBidCount(@PathVariable Long auctionId) {
        long count = bidService.getBidCount(auctionId);
        return ResponseEntity.ok(count);
    }
}