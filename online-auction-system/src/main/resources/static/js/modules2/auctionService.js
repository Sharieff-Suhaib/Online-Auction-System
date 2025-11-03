import { formatCurrency } from './currency.js';
import { showNotification } from './notifications.js';

export let auctions = [];

export async function loadAuctions() {
    try {
        const r = await fetch('/api/auctions');
        auctions = await r.json();
        displayAuctions(auctions);
    } catch {
        document.getElementById('auction-grid').textContent = 'Error loading auctions';
    }
}

export function displayAuctions(list) {
    const el = document.getElementById('auction-grid');
    if (!el) return;
    if (!list.length) return el.innerHTML='No auctions yet.';
    el.innerHTML = list.map(a=>`
        <div class="auction-card" data-auction-id="${a.id}">
            <h3>${a.productName}</h3>
            <span class="current-bid">${formatCurrency(a.currentBid)}</span>
        </div>
    `).join('');
}

export async function updateAuctionDetail(id) {
    const modal = document.getElementById('auction-detail-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    await fetch(`/api/auctions/${id}`);
}
