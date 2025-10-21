package com.auction.online_auction_system.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();



    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("🔌 WebSocket connection established: {} | Total connections: {}",
                session.getId(), sessions.size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        log.info("🔌 WebSocket connection closed: {} | Total connections: {}",
                session.getId(), sessions.size());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        log.debug("📨 Received WebSocket message: {}", message.getPayload());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("❌ WebSocket transport error: {}", exception.getMessage());
        sessions.remove(session);
    }

    /**
     * Broadcast bid to all connected clients
     */
    public void broadcastBid(BidMessage bidMessage) {
        try {
            String message = objectMapper.writeValueAsString(bidMessage);
            TextMessage textMessage = new TextMessage(message);

            int successCount = 0;
            int failCount = 0;

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                        successCount++;
                    } catch (IOException e) {
                        log.error("❌ Error sending message to session {}: {}",
                                session.getId(), e.getMessage());
                        failCount++;
                        sessions.remove(session);
                    }
                }
            }

            log.info("📡 Broadcast bid: ${} by {} | Sent to {} clients | Failed: {}",
                    bidMessage.getBidAmount(),
                    bidMessage.getUsername(),
                    successCount,
                    failCount);

        } catch (Exception e) {
            log.error("❌ Error broadcasting bid: {}", e.getMessage());
        }
    }
}