export function showNotification(msg,type='info'){
    const el=document.createElement('div');
    el.textContent=msg;
    el.style.cssText=`
        position:fixed;top:100px;right:20px;padding:1rem;
        background:${type==='error'?'#fee2e2':'#d1fae5'};
        color:${type==='error'?'#ef4444':'#10b981'};
        border-radius:.5rem;
    `;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),4000);
}
