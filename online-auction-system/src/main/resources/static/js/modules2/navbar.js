let currentUser = null;

export function setCurrentUser(user) {
    currentUser = user;
}
export function updateNavbar() {
    if (!currentUser) return;

    document.getElementById('nav-login')?.classList.add('hidden');
    document.getElementById('nav-register')?.classList.add('hidden');
    document.getElementById('nav-sell')?.classList.remove('hidden');
    document.getElementById('nav-logout')?.classList.remove('hidden');

    const u = document.getElementById('nav-username');
    if (u) {
        u.classList.remove('hidden');
        u.textContent = `👤 ${currentUser.username}`;
    }
}
export function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}
