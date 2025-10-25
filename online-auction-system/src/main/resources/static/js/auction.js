/**
 * Online Auction System - INR Currency
 *
 * @author Sharieff-Suhaib
 * @since 2025-10-25 06:56:32 UTC
 */

let websocket = null;
let currentUser = null;
let auctions = [];
let selectedImageFile = null;

// ============================================================================
// CURRENCY FORMATTER
// ============================================================================

function formatCurrency(amount) {
    return `₹${parseFloat(amount).toFixed(2)}`;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏆 Online Auction System Initialized');
    console.log('👤 Developer: Sharieff-Suhaib');
    console.log('📅 Date: 2025-10-25 06:56:32 UTC');

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
        setupAuctionSummaryUpdater();
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

        const usernameEl = document.getElementById('nav-username');
        if (usernameEl) {
            usernameEl.classList.remove('hidden');
            usernameEl.textContent = `👤 ${currentUser.username}`;
        }
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = '/';
}

// ============================================================================
// IMAGE UPLOAD & PREVIEW
// ============================================================================

window.previewImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        event.target.value = '';
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        event.target.value = '';
        return;
    }

    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('image-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
};

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.imageUrl;
}

// ============================================================================
// AUCTION SUMMARY UPDATER
// ============================================================================

function setupAuctionSummaryUpdater() {
    const startSelect = document.getElementById('auction-start');
    const durationSelect = document.getElementById('auction-duration');

    if (startSelect && durationSelect) {
        startSelect.addEventListener('change', updateAuctionSummary);
        durationSelect.addEventListener('change', updateAuctionSummary);
        updateAuctionSummary();
    }
}

function updateAuctionSummary() {
    const startValue = document.getElementById('auction-start').value;
    const durationMinutes = parseInt(document.getElementById('auction-duration').value);

    const now = new Date();
    let startTime;

    if (startValue === 'now') {
        startTime = new Date(now.getTime() + 10000);
    } else {
        const startMinutes = parseInt(startValue);
        startTime = new Date(now.getTime() + startMinutes * 60000);
    }

    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const summaryText = `
        <strong>Start:</strong> ${startTime.toLocaleString()}<br>
        <strong>End:</strong> ${endTime.toLocaleString()}<br>
        <strong>Duration:</strong> ${durationMinutes} minutes (${(durationMinutes / 60).toFixed(1)} hours)
    `;

    document.getElementById('summary-text').innerHTML = summaryText;
}

// ============================================================================
// SELL PRODUCT MODAL
// ============================================================================

function showSellModal() {
    if (!currentUser) {
        alert('Please login first');
        window.location.href = '/login';
        return;
    }
    document.getElementById('sell-modal').classList.remove('hidden');
    updateAuctionSummary();
}

function closeSellModal() {
    document.getElementById('sell-modal').classList.add('hidden');
    document.getElementById('sell-form').reset();
    document.getElementById('image-preview').classList.add('hidden');
    selectedImageFile = null;
}

document.getElementById('sell-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert('Please login first');
        return;
    }

    if (!selectedImageFile) {
        alert('Please upload a product image');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Uploading image...';
    submitBtn.disabled = true;

    try {
        const imageUrl = await uploadImage(selectedImageFile);
        console.log('✅ Image uploaded:', imageUrl);

        submitBtn.textContent = '⏳ Creating product...';

        const startValue = document.getElementById('auction-start').value;
        const durationMinutes = parseInt(document.getElementById('auction-duration').value);

        const now = new Date();
        let startTime;

        if (startValue === 'now') {
            startTime = new Date(now.getTime() + 10000);
        } else {
            const startMinutes = parseInt(startValue);
            startTime = new Date(now.getTime() + startMinutes * 60000);
        }

        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

        // ✅ Format dates without timezone
        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        const productData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            category: document.getElementById('product-category').value,
            startingPrice: parseFloat(document.getElementById('product-price').value),
            imageUrl: imageUrl,
            sellerId: currentUser.id
        };

        const productResponse = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (!productResponse.ok) {
            const error = await productResponse.json();
            throw new Error(error.message || 'Failed to create product');
        }

        const product = await productResponse.json();
        console.log('✅ Product created:', product);

        submitBtn.textContent = '⏳ Creating auction...';

        const auctionData = {
            productId: product.id,
            startTime: formatDateTime(startTime),
            endTime: formatDateTime(endTime),
            minimumIncrement: parseFloat(document.getElementById('bid-increment').value)
        };

        const auctionResponse = await fetch('/api/auctions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auctionData)
        });

        if (!auctionResponse.ok) {
            const error = await auctionResponse.json();
            throw new Error(error.message || 'Failed to create auction');
        }

        const auction = await auctionResponse.json();
        console.log('✅ Auction created:', auction);

        showNotification('✅ Product listed successfully! Auction will start soon.', 'success');
        closeSellModal();
        setTimeout(() => loadAuctions(), 2000);

    } catch (error) {
        console.error('❌ Error:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
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
    const detailModal = document.getElementById('auction-detail-modal');
    if (detailModal && !detailModal.classList.contains('hidden')) {
        const auctionId = detailModal.getAttribute('data-auction-id');
        if (auctionId == bidMessage.auctionId) {
            updateAuctionDetail(bidMessage.auctionId);
        }
    }

    const auctionCard = document.querySelector(`[data-auction-id="${bidMessage.auctionId}"]`);
    if (auctionCard) {
        const currentBidElement = auctionCard.querySelector('.current-bid');
        if (currentBidElement) {
            currentBidElement.textContent = formatCurrency(bidMessage.bidAmount);
        }
    }

    showNotification(`New bid: ${formatCurrency(bidMessage.bidAmount)} by ${bidMessage.username}`);
}

// ============================================================================
// AUCTION FUNCTIONS
// ============================================================================

async function loadAuctions() {
    try {
        console.log('📡 Loading auctions...');
        const response = await fetch('/api/auctions');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
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
        <div class="auction-card" data-auction-id="${auction.id}" onclick="showAuctionDetail(${auction.id})">
            <div class="auction-image">
                ${auction.productImageUrl ?
                    `<img src="${auction.productImageUrl}" alt="${auction.productName}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2250%22>📦</text></svg>'" />` :
                    '<div class="no-image">📦</div>'}
            </div>
            <div class="auction-content">
                <span class="auction-status status-${auction.status.toLowerCase()}">
                    ${auction.status}
                </span>
                <h3 class="auction-title">${auction.productName}</h3>
                <p class="auction-description">${(auction.productDescription || 'No description').substring(0, 80)}${auction.productDescription && auction.productDescription.length > 80 ? '...' : ''}</p>

                <div class="auction-info">
                    <div class="info-item">
                        <span class="info-label">Current Bid</span>
                        <span class="current-bid">${formatCurrency(auction.currentBid)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Time Left</span>
                        <span class="auction-timer" data-end-time="${auction.endTime}">
                            ${getTimeRemaining(auction.endTime)}
                        </span>
                    </div>
                </div>

                <div class="auction-stats">
                    <span class="stat-item">👥 ${auction.totalBids} bids</span>
                    ${auction.status === 'LIVE' ? '<span class="stat-item live-indicator">🔴 Live Now</span>' : ''}
                </div>

                <button class="btn btn-primary btn-block btn-view-details" onclick="event.stopPropagation(); showAuctionDetail(${auction.id})">
                    ${auction.status === 'LIVE' ? '💰 Place Bid' : '👁️ View Details'}
                </button>
            </div>
        </div>
    `).join('');
}

async function showAuctionDetail(auctionId) {
    try {
        const response = await fetch(`/api/auctions/${auctionId}`);
        const auction = await response.json();

        const modal = document.getElementById('auction-detail-modal') || createDetailModal();
        modal.setAttribute('data-auction-id', auctionId);

        const bidsResponse = await fetch(`/api/bids/auction/${auctionId}`);
        const bids = await bidsResponse.json();

        const bidHistoryHTML = bids.length === 0 ?
            '<p class="no-bids">No bids yet. Be the first to bid!</p>' :
            bids.map((bid, index) => `
                <div class="bid-item-detail ${index === 0 ? 'winning' : ''}">
                    <div class="bid-user">
                        <span class="bid-rank">#${index + 1}</span>
                        <span class="bid-username">${bid.username}</span>
                        ${index === 0 ? '<span class="winning-badge">🏆 Winning</span>' : ''}
                    </div>
                    <div class="bid-info">
                        <span class="bid-amount-detail">${formatCurrency(bid.bidAmount)}</span>
                        <span class="bid-time">${new Date(bid.bidTime).toLocaleString()}</span>
                    </div>
                </div>
            `).join('');

        modal.innerHTML = `
            <div class="modal-content modal-detail">
                <span class="close" onclick="closeAuctionDetail()">&times;</span>

                <div class="detail-grid">
                    <div class="detail-left">
                        <div class="detail-image">
                            ${auction.productImageUrl ?
                                `<img src="${auction.productImageUrl}" alt="${auction.productName}" />` :
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
                                <span class="price-value">${formatCurrency(auction.currentBid)}</span>
                            </div>
                            <div class="price-item">
                                <span class="price-label">Min. Increment</span>
                                <span class="price-increment">+${formatCurrency(auction.minimumIncrement)}</span>
                            </div>
                        </div>

                        <div class="detail-timer">
                            <span class="timer-label">⏰ Time Remaining:</span>
                            <span class="timer-value" data-end-time="${auction.endTime}">
                                ${getTimeRemaining(auction.endTime)}
                            </span>
                        </div>

                        ${auction.status === 'LIVE' && currentUser ? `
                            <div class="bid-input-section">
                                <input type="number"
                                       id="bid-amount-modal"
                                       class="bid-input-modal"
                                       placeholder="Enter your bid amount"
                                       min="${parseFloat(auction.currentBid) + parseFloat(auction.minimumIncrement)}"
                                       step="${auction.minimumIncrement}" />
                                <button class="btn btn-success btn-place-bid" onclick="placeBidModal(${auctionId})">
                                    💰 Place Bid
                                </button>
                            </div>
                            <p class="min-bid-note">Minimum bid: ${formatCurrency(parseFloat(auction.currentBid) + parseFloat(auction.minimumIncrement))}</p>
                        ` : !currentUser && auction.status === 'LIVE' ? `
                            <div class="login-prompt">
                                <p>Please <a href="/login">login</a> to place a bid</p>
                            </div>
                        ` : ''}

                        ${auction.status === 'COMPLETED' && auction.winnerName ? `
                            <div class="winner-section">
                                <h3>🏆 Auction Winner</h3>
                                <p><strong>${auction.winnerName}</strong> won with a bid of <strong>${formatCurrency(auction.winningBid)}</strong></p>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="bid-history-section">
                    <h3>📊 Bid History (${bids.length} bids)</h3>
                    <div class="bid-history-scroll">
                        ${bidHistoryHTML}
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    } catch (error) {
        console.error('❌ Error loading auction detail:', error);
        showNotification('Error loading auction details', 'error');
    }
}

function createDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'auction-detail-modal';
    modal.className = 'modal hidden';
    document.body.appendChild(modal);
    return modal;
}

function closeAuctionDetail() {
    document.getElementById('auction-detail-modal')?.classList.add('hidden');
}

async function placeBidModal(auctionId) {
    if (!currentUser) {
        showNotification('Please login to place a bid', 'error');
        window.location.href = '/login';
        return;
    }

    const bidAmountInput = document.getElementById('bid-amount-modal');
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
            setTimeout(() => showAuctionDetail(auctionId), 500);
            loadAuctions();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to place bid', 'error');
        }
    } catch (error) {
        console.error('❌ Error placing bid:', error);
        showNotification('Error placing bid', 'error');
    }
}

async function updateAuctionDetail(auctionId) {
    if (document.getElementById('auction-detail-modal')?.classList.contains('hidden')) {
        return;
    }
    await showAuctionDetail(auctionId);
}

// ============================================================================
// TIMER FUNCTIONS
// ============================================================================

function getTimeRemaining(endTime) {
    if (!endTime) return '⏰ No time set';

    let end;
    try {
        if (Array.isArray(endTime)) {
            const [year, month, day, hour, minute, second] = endTime;
            end = new Date(year, month - 1, day, hour, minute, second);
        } else if (typeof endTime === 'string') {
            end = new Date(endTime);
        } else {
            return '⏰ Invalid date';
        }

        if (isNaN(end.getTime())) return '⏰ Invalid date';
    } catch (error) {
        return '⏰ Invalid date';
    }

    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return '⏰ Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

function startTimerUpdates() {
    setInterval(() => {
        document.querySelectorAll('.auction-timer').forEach(timer => {
            const endTime = timer.getAttribute('data-end-time');
            if (endTime) {
                timer.textContent = getTimeRemaining(endTime);
            }
        });
        document.querySelectorAll('.timer-value').forEach(timer => {
            const endTime = timer.getAttribute('data-end-time');
            if (endTime) {
                timer.textContent = getTimeRemaining(endTime);
            }
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
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

window.filterAuctions = function(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const filtered = status === 'ALL' ? auctions : auctions.filter(a => a.status === status);
    displayAuctions(filtered);
};

window.showSellModal = showSellModal;
window.closeSellModal = closeSellModal;
window.showAuctionDetail = showAuctionDetail;
window.closeAuctionDetail = closeAuctionDetail;
window.placeBidModal = placeBidModal;
window.logout = logout;

console.log('✅ Auction System (INR Currency) - Sharieff-Suhaib - 2025-10-25 06:56:32 UTC');