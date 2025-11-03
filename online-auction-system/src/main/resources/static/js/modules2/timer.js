export function getTimeRemaining(end) {
    const e = new Date(end);
    const d = e - new Date();
    if (d<=0) return 'Ended';
    const days=Math.floor(d/864e5),h=Math.floor(d/36e5)%24,m=Math.floor(d/6e4)%60,s=Math.floor(d/1e3)%60;
    if (days>0) return `${days}d ${h}h ${m}m`;
    if (h>0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}
export function startTimerUpdates() {
    setInterval(()=>{
        document.querySelectorAll('[data-end-time]').forEach(el=>{
            el.textContent = getTimeRemaining(el.getAttribute('data-end-time'));
        });
    },1000);
}
