/**
 * Checkout Page - Won items management
 *
 * @author Sharieff-Suhaib
 * @since 2025-10-25 04:01:43 UTC
 */

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (!currentUser) {
        window.location.href = '/login';
        return;
    }

    loadWonItems(currentUser.id);
});

async function loadWonItems(userId) {
    try {
        const response = await fetch(`/api/auctions/won/${userId}`);
        const wonItems = await response.json();

        displayWonItems(wonItems);
        calculateTotal(wonItems);
    } catch (error) {
        console.error('❌ Error loading won items:', error);
        document.getElementById('won-items-list').innerHTML =
            '<p class="text-center">No won items found</p>';
    }
}

function displayWonItems(items) {
    const container = document.getElementById('won-items-list');

    if (items.length === 0) {
        container.innerHTML = '<p class="no-items">You haven\'t won any auctions yet. <a href="/auction">Browse Auctions</a></p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="won-item-card">
            <img src="${item.productImageUrl || '/images/placeholder.jpg'}" alt="${item.productName}">
            <div class="won-item-info">
                <h3>${item.productName}</h3>
                <p>Won on: ${new Date(item.endTime).toLocaleDateString()}</p>
                <p class="won-price">$${item.winningBid.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

function calculateTotal(items) {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.winningBid), 0);
    const shipping = 15.00;
    const tax = subtotal * 0.10;
    const total = subtotal + shipping + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function proceedToPayment() {
    alert('Payment gateway integration coming soon!');
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}