/**
 * Online Auction System - JavaScript
 *
 * @author Sharieff-Suhaib
 * @since 2025-01-21 14:58:23 UTC
 */

let websocket = null;
let currentUser = null;
let auctions = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏆 Online Auction System Initialized');
    console.log('👤 Developer: Sharieff-Suhaib');
    console.log('📅 Date: 2025-01-21 14:58:23 UTC');

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        console.log('✅ Current User:', currentUser.username);
        updateNavbar();
    }

    if (window.location.pathname === '/auction') {
        initWebSocket();
        loadAuctions();
        startTimerUpdates();
    }
});

// ============================================================================
// NAVBAR MANAGEMENT
// ============================================================================

function updateNavbar() {
    if (currentUser) {
        document.getElementById('nav-login')?.classList.add('hidden');
        document.getElementById('nav-register')?.classList.add('hidden');
        document.getElementById('nav-sell')?.classList.remove('hidden');
        document.getElementById('nav-logout')?.classList.remove('hidden');
    } else {
        document.getElementById('nav-login')?.classList.remove('hidden');
        document.getElementById('nav-register')?.classList.remove('hidden');
        document.getElementById('nav-sell')?.classList.add('hidden');
        document.getElementById('nav-logout')?.classList.add('hidden');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = '/';
}

// ============================================================================
// SELL PRODUCT MODAL
// ============================================================================

function showSellModal() {
    document.getElementById('sell-modal').classList.remove('hidden');
}

function closeSellModal() {
    document.getElementById('sell-modal').classList.add('hidden');
}

document.getElementById('sell-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert('Please login first');
        return;
    }

    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        category: document.getElementById('product-category').value,
        startingPrice: parseFloat(document.getElementById('product-price').value),
        imageUrl: document.getElementById('product-image').value,
        sellerId: currentUser.id
    };

    try {
        // ✅ STEP 1: Create Product
        const productResponse = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (!productResponse.ok) {
            throw new Error('Failed to create product');
        }

        const product = await productResponse.json();
        console.log('✅ Product created:', product);

        // ✅ STEP 2: Create Auction for the Product
        const now = new Date();
        const startTime = new Date(now.getTime() + 60000); // Start in 1 minute
        const endTime = new Date(now.getTime() + 3600000); // End in 1 hour

        const auctionData = {
            productId: product.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            minimumIncrement: 10.00
        };

        const auctionResponse = await fetch('/api/auctions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auctionData)
        });

        if (!auctionResponse.ok) {
            throw new Error('Failed to create auction');
        }

        const auction = await auctionResponse.json();
        console.log('✅ Auction created:', auction);

        showNotification('✅ Product and auction created successfully!', 'success');
        closeSellModal();
        document.getElementById('sell-form').reset();

        // ✅ RELOAD AUCTIONS to show new item
        loadAuctions();

    } catch (error) {
        console.error('❌ Error creating product/auction:', error);
        showNotification('Error: ' + error.message, 'error');
    }
});

// ============================================================================
// WEBSOCKET CONNECTION
// ============================================================================

function initWebSocket() {
    const wsUrl = `ws://${window.location.host}/ws/auction`;

    try {
        websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
            console.log('🔌 WebSocket Connected');
            showWebSocketStatus('connected');
        };

        websocket.onmessage = (event) => {
            const bidMessage = JSON.parse(event.data);
            console.log('📨 New Bid Received:', bidMessage);
            handleNewBid(bidMessage);
        };

        websocket.onerror = (error) => {
            console.error('❌ WebSocket Error:', error);
            showWebSocketStatus('disconnected');
        };

        websocket.onclose = () => {
            console.log('🔌 WebSocket Disconnected');
            showWebSocketStatus('disconnected');
            setTimeout(initWebSocket, 5000);
        };

    } catch (error) {
        console.error('❌ WebSocket Connection Failed:', error);
    }
}

function showWebSocketStatus(status) {
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

    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

function handleNewBid(bidMessage) {
    const auctionCard = document.querySelector(`[data-auction-id="${bidMessage.auctionId}"]`);

    if (auctionCard) {
        const currentBidElement = auctionCard.querySelector('.current-bid');
        if (currentBidElement) {
            currentBidElement.textContent = `$${bidMessage.bidAmount.toFixed(2)}`;
            currentBidElement.classList.add('fade-in');
        }

        const bidHistory = auctionCard.querySelector('.bid-history');
        if (bidHistory) {
            const bidItem = document.createElement('div');
            bidItem.className = 'bid-item winning';
            bidItem.innerHTML = `
                <span><strong>${bidMessage.username}</strong></span>
                <span>$${bidMessage.bidAmount.toFixed(2)}</span>
            `;
            bidHistory.insertBefore(bidItem, bidHistory.firstChild);
        }
    }

    showNotification(`New bid: $${bidMessage.bidAmount.toFixed(2)} by ${bidMessage.username}`);
}

// ============================================================================
// AUCTION FUNCTIONS
// ============================================================================

async function loadAuctions() {
    try {
        console.log('📡 Loading auctions...');
        const response = await fetch('/api/auctions');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        auctions = await response.json();
        console.log(`✅ Loaded ${auctions.length} auctions`);
        displayAuctions(auctions);
    } catch (error) {
        console.error('❌ Error loading auctions:', error);
        document.getElementById('auction-grid').innerHTML =
            '<p class="text-center">Error loading auctions. Please refresh the page.</p>';
    }
}

function displayAuctions(auctionList) {
    const container = document.getElementById('auction-grid');

    if (!container) return;

    if (auctionList.length === 0) {
        container.innerHTML = '<p class="text-center">No auctions available. Be the first to create one!</p>';
        return;
    }

    container.innerHTML = auctionList.map(auction => `
        <div class="auction-card" data-auction-id="${auction.id}">
            <div class="auction-image">
                ${auction.productImageUrl ?
                    `<img src="${auction.productImageUrl}" alt="${auction.productName}" style="width:100%;height:100%;object-fit:cover;" />` :
                    '📦'}
            </div>
            <div class="auction-content">
                <span class="auction-status status-${auction.status.toLowerCase()}">
                    ${auction.status}
                </span>
                <h3>${auction.productName}</h3>
                <p>${auction.productDescription || 'No description available'}</p>
                <div class="current-bid">$${auction.currentBid.toFixed(2)}</div>
                <div class="auction-timer" data-end-time="${auction.endTime}">
                    ${getTimeRemaining(auction.endTime)}
                </div>
                <p class="text-center"><strong>${auction.totalBids}</strong> bids</p>

                ${auction.status === 'LIVE' ? `
                    <div class="bid-form">
                        <input type="number"
                               id="bid-amount-${auction.id}"
                               placeholder="Enter bid amount"
                               min="${parseFloat(auction.currentBid) + parseFloat(auction.minimumIncrement)}"
                               step="${auction.minimumIncrement}" />
                        <button class="btn btn-success"
                                onclick="placeBid(${auction.id})">
                            Place Bid
                        </button>
                    </div>
                    <p style="margin-top: 0.5rem; color: var(--text-light);">
                        Min: $${(parseFloat(auction.currentBid) + parseFloat(auction.minimumIncrement)).toFixed(2)}
                    </p>
                ` : ''}

                ${auction.status === 'COMPLETED' && auction.winnerName ? `
                    <div class="success-message">
                        🏆 Won by <strong>${auction.winnerName}</strong> for $${auction.winningBid.toFixed(2)}
                    </div>
                ` : ''}

                <div class="bid-history" id="bid-history-${auction.id}"></div>
            </div>
        </div>
    `).join('');

    auctionList.forEach(auction => loadBidHistory(auction.id));
}

async function placeBid(auctionId) {
    if (!currentUser) {
        showNotification('Please login to place a bid', 'error');
        window.location.href = '/login';
        return;
    }

    const bidAmountInput = document.getElementById(`bid-amount-${auctionId}`);
    const bidAmount = parseFloat(bidAmountInput.value);

    if (!bidAmount || bidAmount <= 0) {
        showNotification('Please enter a valid bid amount', 'error');
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
            showNotification('✅ Bid placed successfully!', 'success');
            bidAmountInput.value = '';
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to place bid', 'error');
        }
    } catch (error) {
        console.error('❌ Error placing bid:', error);
        showNotification('Error placing bid', 'error');
    }
}

async function loadBidHistory(auctionId) {
    try {
        const response = await fetch(`/api/bids/auction/${auctionId}`);
        const bids = await response.json();

        const bidHistory = document.getElementById(`bid-history-${auctionId}`);
        if (!bidHistory) return;

        if (bids.length === 0) {
            bidHistory.innerHTML = '<p class="text-center" style="color: var(--text-light);">No bids yet</p>';
            return;
        }

        bidHistory.innerHTML = bids.slice(0, 5).map((bid, index) => `
            <div class="bid-item ${index === 0 ? 'winning' : ''}">
                <span>${bid.username}</span>
                <span>$${bid.bidAmount.toFixed(2)}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ Error loading bid history:', error);
    }
}

// ============================================================================
// TIMER FUNCTIONS
// ============================================================================

function getTimeRemaining(endTime) {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) {
        return '⏰ Auction Ended';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `⏰ ${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `⏰ ${hours}h ${minutes}m ${seconds}s`;
    return `⏰ ${minutes}m ${seconds}s`;
}

function startTimerUpdates() {
    setInterval(() => {
        document.querySelectorAll('.auction-timer').forEach(timer => {
            const endTime = timer.getAttribute('data-end-time');
            timer.textContent = getTimeRemaining(endTime);
        });
    }, 1000);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#fee2e2' : '#d1fae5'};
        color: ${type === 'error' ? '#ef4444' : '#10b981'};
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.filterAuctions = function(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const filtered = status === 'ALL' ? auctions : auctions.filter(a => a.status === status);
    displayAuctions(filtered);
};

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .modal {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }
    .close {
        float: right;
        font-size: 2rem;
        cursor: pointer;
    }
`;
document.head.appendChild(style);

console.log('✅ Auction System JavaScript Loaded Successfully');
console.log('👤 Developer: Sharieff-Suhaib');
console.log('📅 Date: 2025-01-21 14:58:23 UTC');