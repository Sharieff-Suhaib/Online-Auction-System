package com.auction.online_auction_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OnlineAuctionSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(OnlineAuctionSystemApplication.class, args);

        System.out.println("\n" + "=".repeat(60));
        System.out.println("🏆 ONLINE AUCTION SYSTEM - STARTED SUCCESSFULLY!");
        System.out.println("=".repeat(60));
        System.out.println("📅 Date: 2025-10-21 13:35:35 UTC");
        System.out.println("👤 Developer: Sharieff-Suhaib");
        System.out.println("🌐 Application URL: http://localhost:8080");
        System.out.println("🗄️  Database: PostgreSQL (auctiondb)");
        System.out.println("☕ Java Version: 21");
        System.out.println("🍃 Spring Boot: 3.4.0");
        System.out.println("📡 WebSocket: Enabled for Real-time Bidding");
        System.out.println("=".repeat(60) + "\n");
    }
}