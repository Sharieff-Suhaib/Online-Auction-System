import { formatCurrency } from './modules2/currency.js';
import { setCurrentUser, updateNavbar, logout } from './modules2/navbar.js';
import { previewImage } from './modules2/imageUpload.js';
import { setupAuctionSummaryUpdater } from './modules2/auctionSummary.js';
import { showSellModal, closeSellModal, setUser } from './modules2/sellModal.js';
import { initWebSocket } from './modules2/websocket.js';
import { loadAuctions } from './modules2/auctionService.js';
import { startTimerUpdates } from './modules2/timer.js';

document.addEventListener('DOMContentLoaded',()=>{
    const u=localStorage.getItem('currentUser');
    if (u){
        const user=JSON.parse(u);
        setUser(user);
        setCurrentUser(user);
        updateNavbar();
    }
    if (window.location.pathname==='/auction'){
        initWebSocket();
        loadAuctions();
        startTimerUpdates();
        setupAuctionSummaryUpdater();
    }
});
window.previewImage=previewImage;
window.showSellModal=showSellModal;
window.closeSellModal=closeSellModal;
window.logout=logout;
