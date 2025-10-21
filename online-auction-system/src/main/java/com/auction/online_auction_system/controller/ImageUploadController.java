package com.auction.online_auction_system.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Image Upload Controller - Fixed for Runtime Upload
 *
 * @author Sharieff-Suhaib
 * @since 2025-10-21 17:03:08 UTC
 */
@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
@Slf4j
public class ImageUploadController {

    // ✅ FIXED: Save to target folder instead (runtime accessible)
    private static final String UPLOAD_DIR = "target/classes/static/images/products/";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        log.info("📸 Receiving image upload: {}", file.getOriginalFilename());

        // Validation
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Please select a file"));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(createErrorResponse("File size must be less than 5MB"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(createErrorResponse("Only image files are allowed"));
        }

        try {
            // ✅ Create directory if doesn't exist
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                boolean created = uploadDir.mkdirs();
                log.info("✅ Created upload directory: {} (success: {})", UPLOAD_DIR, created);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ?
                    originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = UUID.randomUUID().toString() + extension;

            // Save file to target folder (runtime accessible)
            Path path = Paths.get(UPLOAD_DIR + filename);
            Files.write(path, file.getBytes());

            // ✅ ALSO save to src folder for persistence across restarts
            String srcDir = "src/main/resources/static/images/products/";
            File srcUploadDir = new File(srcDir);
            if (!srcUploadDir.exists()) {
                srcUploadDir.mkdirs();
            }
            Path srcPath = Paths.get(srcDir + filename);
            Files.write(srcPath, file.getBytes());

            // Return public URL
            String imageUrl = "/images/products/" + filename;

            log.info("✅ Image uploaded successfully: {}", imageUrl);
            log.info("📁 Saved to: {}", path.toAbsolutePath());
            log.info("📁 Saved to: {}", srcPath.toAbsolutePath());

            Map<String, Object> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            response.put("filename", filename);
            response.put("size", file.getSize());
            response.put("path", path.toAbsolutePath().toString());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("❌ Failed to upload image: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload image: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}