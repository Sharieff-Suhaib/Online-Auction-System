/**
 * UI Manager - User interface operations
 *
 * @author Sharieff-Suhaib
 * @since 2025-10-25 04:01:43 UTC
 */

export const UIManager = {
    updateNavbar() {
        const currentUser = window.auctionApp.currentUser;
        if (!currentUser) return;

        document.getElementById('nav-login')?.classList.add('hidden');
        document.getElementById('nav-register')?.classList.add('hidden');
        document.getElementById('nav-sell')?.classList.remove('hidden');
        document.getElementById('nav-checkout')?.classList.remove('hidden');
        document.getElementById('nav-logout')?.classList.remove('hidden');

        const usernameEl = document.getElementById('username-text');
        if (usernameEl) usernameEl.textContent = currentUser.username;

        document.getElementById('nav-username')?.classList.remove('hidden');
    },

    logout() {
        localStorage.removeItem('currentUser');
        window.auctionApp.currentUser = null;
        window.location.href = '/';
    },

    showSellModal() {
        if (!window.auctionApp.currentUser) {
            alert('Please login first');
            window.location.href = '/login';
            return;
        }
        document.getElementById('sell-modal').classList.remove('hidden');
    },

    closeSellModal() {
        document.getElementById('sell-modal').classList.add('hidden');
        document.getElementById('sell-form').reset();
        document.getElementById('image-preview')?.classList.add('hidden');
    }
};