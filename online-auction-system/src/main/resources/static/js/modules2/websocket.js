import { showNotification } from './notifications.js';
import { formatCurrency } from './currency.js';
import { updateAuctionDetail } from './auctionService.js';

let websocket = null;

export function initWebSocket() {
    const url = `ws://${window.location.host}/ws/auction`;
    websocket = new WebSocket(url);

    websocket.onopen   = () => showStatus('connected');
    websocket.onerror  = () => showStatus('disconnected');
    websocket.onclose  = () => setTimeout(initWebSocket,5000);
    websocket.onmessage = e => {
        const m = JSON.parse(e.data);
        handleNewBid(m);
    };
}
function showStatus(s){
    const el = document.getElementById('ws-status') || Object.assign(document.body.appendChild(document.createElement('div')), {id:'ws-status'});
    el.textContent = s==='connected'?'🟢 Live Updates':'🔴 Reconnecting';
    setTimeout(()=>el.style.display='none',3000);
}
function handleNewBid(m){
    showNotification(`New bid: ${formatCurrency(m.bidAmount)} by ${m.username}`);
    updateAuctionDetail(m.auctionId);
}
