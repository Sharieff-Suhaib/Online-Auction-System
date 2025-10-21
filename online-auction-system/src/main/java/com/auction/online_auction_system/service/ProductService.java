package com.auction.online_auction_system.service;

import com.auction.online_auction_system.dto.ProductDTO;
import com.auction.online_auction_system.entity.Product;
import com.auction.online_auction_system.entity.User;
import com.auction.online_auction_system.exception.AuctionException;
import com.auction.online_auction_system.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final UserService userService;

    public ProductDTO createProduct(ProductDTO productDTO) {
        log.info("Creating new product: {}", productDTO.getName());
        User seller = userService.getUserEntityById(productDTO.getSellerId());

        Product product = new Product();
        product.setName(productDTO.getName());
        product.setDescription(productDTO.getDescription());
        product.setImageUrl(productDTO.getImageUrl());
        product.setCategory(productDTO.getCategory());
        product.setStartingPrice(productDTO.getStartingPrice());
        product.setReservePrice(productDTO.getReservePrice());
        product.setSeller(seller);
        product.setStatus(Product.ProductStatus.AVAILABLE);

        Product savedProduct = productRepository.save(product);
        log.info("Product created successfully: {}", savedProduct.getName());

        return ProductDTO.fromEntity(savedProduct);
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        log.debug("Fetching product by ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AuctionException("Product not found with id: " + id));
        return ProductDTO.fromEntity(product);
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProducts() {
        log.debug("Fetching all products");
        return productRepository.findAll().stream()
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByStatus(Product.ProductStatus status) {
        log.debug("Fetching products by status: {}", status);
        return productRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByCategory(String category) {
        log.debug("Fetching products by category: {}", category);
        return productRepository.findByCategory(category).stream()
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> searchProducts(String name) {
        log.debug("Searching products with name: {}", name);
        return productRepository.findByNameContainingIgnoreCase(name).stream()
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        log.debug("Fetching all categories");
        return productRepository.findAllCategories();
    }

    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        log.info("Updating product: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AuctionException("Product not found with id: " + id));

        if (productDTO.getName() != null) {
            product.setName(productDTO.getName());
        }
        if (productDTO.getDescription() != null) {
            product.setDescription(productDTO.getDescription());
        }
        if (productDTO.getImageUrl() != null) {
            product.setImageUrl(productDTO.getImageUrl());
        }
        if (productDTO.getCategory() != null) {
            product.setCategory(productDTO.getCategory());
        }
        if (productDTO.getStartingPrice() != null) {
            product.setStartingPrice(productDTO.getStartingPrice());
        }
        if (productDTO.getReservePrice() != null) {
            product.setReservePrice(productDTO.getReservePrice());
        }

        Product updatedProduct = productRepository.save(product);
        log.info("Product updated successfully: {}", updatedProduct.getName());

        return ProductDTO.fromEntity(updatedProduct);
    }

    public void deleteProduct(Long id) {
        log.info("Deleting product: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AuctionException("Product not found with id: " + id));
        productRepository.delete(product);
        log.info("Product deleted successfully: {}", id);
    }

    public Product getProductEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new AuctionException("Product not found with id: " + id));
    }
}