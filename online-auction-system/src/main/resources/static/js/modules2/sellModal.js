import { updateAuctionSummary } from './auctionSummary.js';
import { getSelectedFile, resetSelectedFile, uploadImage } from './imageUpload.js';
import { showNotification } from './notifications.js';
import { loadAuctions } from './auctionService.js';

let currentUser = null;
export function setUser(u){ currentUser=u;}

export function showSellModal() {
    if (!currentUser) return window.location.href='/login';
    document.getElementById('sell-modal').classList.remove('hidden');
    updateAuctionSummary();
}
export function closeSellModal() {
    document.getElementById('sell-modal').classList.add('hidden');
    document.getElementById('sell-form').reset();
    document.getElementById('image-preview').classList.add('hidden');
    resetSelectedFile();
}
document.getElementById('sell-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const file = getSelectedFile();
    if (!file) return alert('Upload product image');
    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.textContent;
    try {
        btn.textContent='Uploading image...'; btn.disabled=true;
        const imageUrl = await uploadImage(file);
        btn.textContent='Creating...';

        const body = {
            name:document.getElementById('product-name').value,
            description:document.getElementById('product-description').value,
            category:document.getElementById('product-category').value,
            startingPrice:parseFloat(document.getElementById('product-price').value),
            imageUrl,
            sellerId: currentUser.id
        };
        await fetch('/api/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        showNotification('Product listed','success');
        closeSellModal();
        setTimeout(loadAuctions,2000);
    } catch(err){
        showNotification(err.message,'error');
    } finally{
        btn.textContent=original; btn.disabled=false;
    }
});
