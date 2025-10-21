let websocket = null;
let currentUser = null;
let auctions = [];
let selectedImageFile = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏆 Online Auction System Initialized');
    console.log('👤 Developer: Sharieff-Suhaib');
    console.log('📅 Date: 2025-10-21 16:53:42 UTC');

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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        event.target.value = '';
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        event.target.value = '';
        return;
    }

    // Store the file for later upload
    selectedImageFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('image-preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
};

// ✅ NEW: Upload image to server
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
    return data.imageUrl; // Returns: /images/products/uuid.jpg
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
        // ✅ STEP 1: Upload Image First
        const imageUrl = await uploadImage(selectedImageFile);
        console.log('✅ Image uploaded:', imageUrl);

        submitBtn.textContent = '⏳ Creating product...';

        // Get auction timing
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

        // ✅ STEP 2: Create Product (with short URL, not Base64)
        const productData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            category: document.getElementById('product-category').value,
            startingPrice: parseFloat(document.getElementById('product-price').value),
            imageUrl: imageUrl, // ✅ Short URL instead of Base64
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

        // ✅ STEP 3: Create Auction
        const auctionData = {
            productId: product.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
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
                               placeholder="Enter your bid"
                               min="${parseFloat(auction.currentBid) + parseFloat(auction.minimumIncrement)}"
                               step="${auction.minimumIncrement}" />
                        <button class="btn btn-success"
                                onclick="placeBid(${auction.id})">
                            💰 Place Bid
                        </button>
                    </div>
                    <p style="margin-top: 0.5rem; color: var(--text-light); font-size: 0.9rem;">
                        Minimum bid: $${(parseFloat(auction.currentBid) + parseFloat(auction.minimumIncrement)).toFixed(2)}
                    </p>
                ` : auction.status === 'SCHEDULED' ? `
                    <p style="text-align: center; color: var(--warning-color); font-weight: 600;">
                        ⏰ Auction starts soon!
                    </p>
                ` : ''}

                ${auction.status === 'COMPLETED' && auction.winnerName ? `
                    <div class="success-message">
                        🏆 Won by <strong>${auction.winnerName}</strong> for $${auction.winningBid.toFixed(2)}
                    </div>
                ` : auction.status === 'COMPLETED' ? `
                    <div class="error-message">
                        ❌ Auction ended with no bids
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
            loadBidHistory(auctionId);
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
            bidHistory.innerHTML = '<p class="text-center" style="color: var(--text-light); font-size: 0.9rem;">No bids yet. Be the first!</p>';
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

// Add animations and styles
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
        background-color: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }
    .modal-content h2 {
        margin-bottom: 1.5rem;
        color: var(--primary-color);
    }
    .modal-content h3 {
        margin: 1.5rem 0 1rem 0;
        color: var(--text-dark);
        font-size: 1.1rem;
    }
    .close {
        float: right;
        font-size: 2rem;
        cursor: pointer;
        color: var(--danger-color);
    }
    .close:hover {
        color: var(--text-dark);
    }
    .image-preview {
        margin-top: 1rem;
        text-align: center;
    }
    .image-preview img {
        max-width: 100%;
        max-height: 200px;
        border-radius: 0.5rem;
        border: 2px solid var(--border-color);
    }
    .form-section {
        background: var(--light-bg);
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
    }
    .auction-summary {
        background: #e0f2fe;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
        border-left: 4px solid var(--primary-color);
    }
    .auction-summary h4 {
        margin-bottom: 0.5rem;
        color: var(--primary-color);
    }
    .auction-summary p {
        margin: 0;
        line-height: 1.8;
    }
    .form-group small {
        display: block;
        margin-top: 0.25rem;
        color: var(--text-light);
        font-size: 0.875rem;
    }
`;
document.head.appendChild(style);

console.log('✅ Auction System JavaScript Loaded Successfully');
console.log('👤 Developer: Sharieff-Suhaib');
console.log('📅 Date: 2025-10-21 15:06:02 UTC');