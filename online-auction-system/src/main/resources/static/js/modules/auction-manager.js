/**
 * Auction Manager - Handles all auction operations
 *
 * @author Sharieff-Suhaib
 * @since 2025-10-25 04:01:43 UTC
 */

export const AuctionManager = {
    async loadAll() {
        try {
            console.log('📡 Loading auctions...');
            const response = await fetch('/api/auctions');

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            window.auctionApp.auctions = await response.json();
            console.log(`✅ Loaded ${window.auctionApp.auctions.length} auctions`);

            this.displayAll(window.auctionApp.auctions);
        } catch (error) {
            console.error('❌ Error loading auctions:', error);
            document.getElementById('auction-grid').innerHTML =
                '<p class="text-center">Error loading auctions. Please refresh.</p>';
        }
    },

    displayAll(auctionList) {
        const container = document.getElementById('auction-grid');
        if (!container) return;

        if (auctionList.length === 0) {
            container.innerHTML = '<p class="text-center">No auctions available. Be the first to create one!</p>';
            return;
        }

        container.innerHTML = auctionList.map(auction => this.createCard(auction)).join('');
    },

    createCard(auction) {
        return `
            <div class="auction-card" data-auction-id="${auction.id}" onclick="showDetail(${auction.id})">
                <div class="auction-image">
                    ${auction.productImageUrl ?
                        `<img src="${auction.productImageUrl}" alt="${auction.productName}"
                              onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>📦</div>'">` :
                        '<div class="no-image">📦</div>'}
                </div>
                <div class="auction-content">
                    <span class="auction-status status-${auction.status.toLowerCase()}">
                        ${auction.status}
                    </span>
                    <h3 class="auction-title">${auction.productName}</h3>
                    <p class="auction-description">
                        ${(auction.productDescription || 'No description').substring(0, 80)}
                        ${auction.productDescription && auction.productDescription.length > 80 ? '...' : ''}
                    </p>

                    <div class="auction-info">
                        <div class="info-item">
                            <span class="info-label">Current Bid</span>
                            <span class="current-bid">$${auction.currentBid.toFixed(2)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Time Left</span>
                            <span class="auction-timer" data-end-time="${auction.endTime}">
                                Loading...
                            </span>
                        </div>
                    </div>

                    <div class="auction-stats">
                        <span class="stat-item">👥 ${auction.totalBids} bids</span>
                        ${auction.status === 'LIVE' ? '<span class="stat-item live-indicator">🔴 Live Now</span>' : ''}
                    </div>

                    <button class="btn btn-primary btn-block" onclick="event.stopPropagation(); showDetail(${auction.id})">
                        ${auction.status === 'LIVE' ? '💰 Place Bid' : '👁️ View Details'}
                    </button>
                </div>
            </div>
        `;
    },

    async showDetail(auctionId) {
        try {
            const [auctionRes, bidsRes] = await Promise.all([
                fetch(`/api/auctions/${auctionId}`),
                fetch(`/api/bids/auction/${auctionId}`)
            ]);

            const auction = await auctionRes.json();
            const bids = await bidsRes.json();

            const modal = document.getElementById('detail-modal') || this.createModal();
            modal.setAttribute('data-auction-id', auctionId);
            modal.innerHTML = this.createDetailHTML(auction, bids);
            modal.classList.remove('hidden');
        } catch (error) {
            console.error('❌ Detail error:', error);
            this.showNotification('❌ Error loading auction details');
        }
    },

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'detail-modal';
        modal.className = 'modal hidden';
        document.body.appendChild(modal);
        return modal;
    },

    createDetailHTML(auction, bids) {
        const currentUser = window.auctionApp.currentUser;

        return `
            <div class="modal-content modal-detail">
                <span class="close" onclick="closeDetail()">&times;</span>

                <div class="detail-grid">
                    <div class="detail-left">
                        <div class="detail-image">
                            ${auction.productImageUrl ?
                                `<img src="${auction.productImageUrl}" alt="${auction.productName}">` :
                                '<div class="no-image-large">📦</div>'}
                        </div>
                    </div>

                    <div class="detail-right">
                        <span class="auction-status status-${auction.status.toLowerCase()}">${auction.status}</span>
                        <h2>${auction.productName}</h2>
                        <p class="detail-description">${auction.productDescription || 'No description available'}</p>

                        <div class="detail-price-section">
                            <div class="price-item">
                                <span class="price-label">Current Bid</span>
                                <span class="price-value">$${auction.currentBid.toFixed(2)}</span>
                            </div>
                            <div class="price-item">
                                <span class="price-label">Min. Increment</span>
                                <span class="price-increment">+$${auction.minimumIncrement.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="detail-timer">
                            <span class="timer-label">⏰ Time Remaining:</span>
                            <span class="timer-value" data-end-time="${auction.endTime}">Loading...</span>
                        </div>

                        ${this.createBidSection(auction, currentUser)}
                    </div>
                </div>

                ${this.createBidHistory(bids)}
            </div>
        `;
    },

    createBidSection(auction, currentUser) {
        if (auction.status === 'LIVE' && currentUser) {
            return `
                <div class="bid-input-section">
                    <input type="number"
                           id="bid-amount-modal"
                           class="bid-input-modal"
                           placeholder="Enter your bid amount"
                           min="${parseFloat(auction.currentBid) + parseFloat(auction.minimumIncrement)}"
                           step="${auction.minimumIncrement}" />
                    <button class="btn btn-success btn-place-bid" onclick="placeBid(${auction.id})">
                        💰 Place Bid
                    </button>
                </div>
                <p class="min-bid-note">Minimum bid: $${(parseFloat(auction.currentBid) + parseFloat(auction.minimumIncrement)).toFixed(2)}</p>
            `;
        } else if (!currentUser && auction.status === 'LIVE') {
            return `<div class="login-prompt"><p>Please <a href="/login">login</a> to place a bid</p></div>`;
        } else if (auction.status === 'COMPLETED' && auction.winnerName) {
            return `
                <div class="winner-section">
                    <h3>🏆 Auction Winner</h3>
                    <p><strong>${auction.winnerName}</strong> won with a bid of <strong>$${auction.winningBid.toFixed(2)}</strong></p>
                </div>
            `;
        }
        return '';
    },

    createBidHistory(bids) {
        return `
            <div class="bid-history-section">
                <h3>📊 Bid History (${bids.length} bids)</h3>
                <div class="bid-history-scroll">
                    ${bids.length === 0 ? '<p class="no-bids">No bids yet. Be the first to bid!</p>' :
                        bids.map((bid, index) => `
                            <div class="bid-item-detail ${index === 0 ? 'winning' : ''}">
                                <div class="bid-user">
                                    <span class="bid-rank">#${index + 1}</span>
                                    <span class="bid-username">${bid.username}</span>
                                    ${index === 0 ? '<span class="winning-badge">🏆 Winning</span>' : ''}
                                </div>
                                <div class="bid-info">
                                    <span class="bid-amount-detail">$${bid.bidAmount.toFixed(2)}</span>
                                    <span class="bid-time">${new Date(bid.bidTime).toLocaleString()}</span>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    },

    closeDetail() {
        document.getElementById('detail-modal')?.classList.add('hidden');
    },

    async placeBid(auctionId) {
        const currentUser = window.auctionApp.currentUser;

        if (!currentUser) {
            this.showNotification('❌ Please login first');
            window.location.href = '/login';
            return;
        }

        const bidAmountInput = document.getElementById('bid-amount-modal');
        const bidAmount = parseFloat(bidAmountInput.value);

        if (!bidAmount || bidAmount <= 0) {
            this.showNotification('❌ Please enter a valid bid amount');
            return;
        }

        try {
            const response = await fetch('/api/bids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auctionId: auctionId,
                    userId: currentUser.id,
                    bidAmount: bidAmount
                })
            });

            if (response.ok) {
                this.showNotification('✅ Bid placed successfully!');
                bidAmountInput.value = '';
                setTimeout(() => this.showDetail(auctionId), 500);
            } else {
                const error = await response.json();
                this.showNotification('❌ ' + (error.message || 'Failed to place bid'));
            }
        } catch (error) {
            console.error('❌ Bid error:', error);
            this.showNotification('❌ Error placing bid');
        }
    },

    filter(status) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const filtered = status === 'ALL' ? window.auctionApp.auctions :
                         window.auctionApp.auctions.filter(a => a.status === status);
        this.displayAll(filtered);
    },

    showNotification(message) {
        const notif = document.createElement('div');
        notif.textContent = message;
        notif.style.cssText = `
            position: fixed; top: 100px; right: 20px; padding: 1rem 1.5rem;
            background: ${message.includes('❌') ? '#fee2e2' : '#d1fae5'};
            color: ${message.includes('❌') ? '#ef4444' : '#10b981'};
            border-radius: 0.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            z-index: 9999; font-weight: 600; animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 4000);
    }
};