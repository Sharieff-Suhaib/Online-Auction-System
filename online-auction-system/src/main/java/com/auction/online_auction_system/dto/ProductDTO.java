package com.auction.online_auction_system.dto;

import com.auction.online_auction_system.entity.Product;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDTO {

    private Long id;

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;
    private String imageUrl;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Starting price is required")
    @DecimalMin(value = "0.01", message = "Starting price must be greater than 0")
    private BigDecimal startingPrice;

    private BigDecimal reservePrice;
    private Long sellerId;
    private String sellerName;
    private Product.ProductStatus status;
    private LocalDateTime createdAt;

    public static ProductDTO fromEntity(Product product) {
        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .imageUrl(product.getImageUrl())
                .category(product.getCategory())
                .startingPrice(product.getStartingPrice())
                .reservePrice(product.getReservePrice())
                .sellerId(product.getSeller().getId())
                .sellerName(product.getSeller().getUsername())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .build();
    }
}