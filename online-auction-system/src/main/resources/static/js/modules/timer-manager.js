/**
 * Timer Manager - Client-side countdown
 *
 * @author Sharieff-Suhaib
 * @since 2025-10-25 04:01:43 UTC
 */

export const TimerManager = {
    interval: null,

    start() {
        console.log('⏰ Starting countdown timer...');

        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(() => {
            this.updateAll();
        }, 1000);

        console.log('✅ Timer active - updating every 1 second');
    },

    updateAll() {
        // Update auction card timers
        document.querySelectorAll('.auction-timer[data-end-time]').forEach(el => {
            const endTime = el.getAttribute('data-end-time');
            if (endTime) {
                const timeText = this.calculate(endTime);
                el.textContent = timeText;
                if (timeText === '⏰ Ended') el.style.color = '#6b7280';
            }
        });

        // Update modal timer
        document.querySelectorAll('.timer-value[data-end-time]').forEach(el => {
            const endTime = el.getAttribute('data-end-time');
            if (endTime) el.textContent = this.calculate(endTime);
        });
    },

    calculate(endTimeStr) {
        if (!endTimeStr) return '⏰ No time';

        try {
            const end = new Date(endTimeStr);
            const now = new Date();

            if (isNaN(end.getTime())) return '⏰ Invalid';

            const diff = end - now;

            if (diff <= 0) return '⏰ Ended';

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) return `${days}d ${hours}h ${minutes}m`;
            if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
            return `${minutes}m ${seconds}s`;
        } catch (error) {
            console.error('Timer error:', error);
            return '⏰ Error';
        }
    },

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
};