package com.auction.online_auction_system.repository;

import com.auction.online_auction_system.entity.Product;
import com.auction.online_auction_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByStatus(Product.ProductStatus status);

    List<Product> findBySeller(User seller);

    List<Product> findByCategory(String category);

    List<Product> findByNameContainingIgnoreCase(String name);

    @Query("SELECT DISTINCT p.category FROM Product p ORDER BY p.category")
    List<String> findAllCategories();

    @Query("SELECT p FROM Product p WHERE p.status = :status ORDER BY p.createdAt DESC")
    List<Product> findByStatusOrderByCreatedAtDesc(@Param("status") Product.ProductStatus status);
}