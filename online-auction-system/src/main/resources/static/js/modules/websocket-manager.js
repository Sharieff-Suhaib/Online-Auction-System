/**
 * WebSocket Manager - Real-time updates
 *
 * @author Sharieff-Suhaib
 * @since 2025-10-25 04:01:43 UTC
 */

export const WebSocketManager = {
    ws: null,

    init() {
        const wsUrl = `ws://${window.location.host}/ws/auction`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('🔌 WebSocket Connected');
                this.showStatus('connected');
            };

            this.ws.onmessage = (event) => {
                const bidMessage = JSON.parse(event.data);
                console.log('📨 New Bid:', bidMessage);
                this.handleBid(bidMessage);
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket Error:', error);
                this.showStatus('disconnected');
            };

            this.ws.onclose = () => {
                console.log('🔌 Reconnecting...');
                this.showStatus('disconnected');
                setTimeout(() => this.init(), 5000);
            };

            window.auctionApp.websocket = this.ws;
        } catch (error) {
            console.error('❌ WebSocket Failed:', error);
        }
    },

    handleBid(bidMessage) {
        // Update modal if open
        const modal = document.getElementById('detail-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const auctionId = modal.getAttribute('data-auction-id');
            if (auctionId == bidMessage.auctionId) {
                import('./auction-manager.js').then(({ AuctionManager }) => {
                    AuctionManager.showDetail(bidMessage.auctionId);
                });
            }
        }

        // Update card
        this.updateCard(bidMessage.auctionId, bidMessage.bidAmount);

        // Show notification
        this.showNotification(`New bid: $${bidMessage.bidAmount.toFixed(2)} by ${bidMessage.username}`);
    },

    async updateCard(auctionId, newBid) {
        const card = document.querySelector(`[data-auction-id="${auctionId}"]`);
        if (card) {
            const bidElement = card.querySelector('.current-bid');
            if (bidElement) {
                bidElement.textContent = `$${newBid.toFixed(2)}`;
                bidElement.classList.add('fade-in');
                setTimeout(() => bidElement.classList.remove('fade-in'), 500);
            }
        }
    },

    showStatus(status) {
        let statusDiv = document.getElementById('ws-status');

        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'ws-status';
            statusDiv.className = 'ws-status';
            document.body.appendChild(statusDiv);
        }

        if (status === 'connected') {
            statusDiv.className = 'ws-status ws-connected';
            statusDiv.textContent = '🟢 Live Updates Active';
        } else {
            statusDiv.className = 'ws-status ws-disconnected';
            statusDiv.textContent = '🔴 Reconnecting...';
        }

        setTimeout(() => statusDiv.style.display = 'none', 3000);
    },

    showNotification(message) {
        const notif = document.createElement('div');
        notif.textContent = message;
        notif.style.cssText = `
            position: fixed; top: 100px; right: 20px; padding: 1rem;
            background: #d1fae5; color: #10b981; border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 9999;
            font-weight: 600; animation: slideIn 0.3s;
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
};