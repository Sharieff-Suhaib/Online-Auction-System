export function setupAuctionSummaryUpdater() {
    const start = document.getElementById('auction-start');
    const dur = document.getElementById('auction-duration');

    if (start && dur) {
        start.addEventListener('change', updateAuctionSummary);
        dur.addEventListener('change', updateAuctionSummary);
        updateAuctionSummary();
    }
}

export function updateAuctionSummary() {
    const startVal = document.getElementById('auction-start').value;
    const mins = parseInt(document.getElementById('auction-duration').value);
    const now = new Date();
    let startTime = startVal === 'now'
        ? new Date(now.getTime() + 10000)
        : new Date(now.getTime() + parseInt(startVal) * 60000);

    const endTime = new Date(startTime.getTime() + mins * 60000);

    document.getElementById('summary-text').innerHTML = `
        <strong>Start:</strong> ${startTime.toLocaleString()}<br>
        <strong>End:</strong> ${endTime.toLocaleString()}<br>
        <strong>Duration:</strong> ${mins} minutes (${(mins/60).toFixed(1)} hours)
    `;
}
