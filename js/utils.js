// js/utils.js
const earthquakeModal = document.getElementById('earthquakeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalDepth = document.getElementById('modalDepth');
const modalLocation = document.getElementById('modalLocation');
const modalMap = document.getElementById('modalMap');
const shareBtn = document.getElementById('shareBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const earthquakeList = document.getElementById('earthquake-list');
const notification = document.getElementById('notification');
const alertSound = document.getElementById('alertSound');
let map;

export function formatDate(dateString, full = false) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24 && !full) {
        return `${diffInHours} saat önce`;
    }

    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function getMagnitudeColor(magnitude) {
    if (magnitude >= 5) return 'var(--danger-color)';
    if (magnitude >= 4) return 'var(--warning-color)';
    return 'var(--success-color)';
}

export function showLoading() {
    loadingIndicator.style.display = 'flex';
    earthquakeList.style.display = 'none';
}

export function hideLoading() {
    loadingIndicator.style.display = 'none';
    earthquakeList.style.display = 'block';
}

export function showError(message) {
    earthquakeList.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

export function showNotification(title, message) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }

    notification.innerHTML = `<strong>${title}</strong><br>${message}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

export function playAlertSound() {
    alertSound.currentTime = 0;
    alertSound.play().catch(e => console.log('Ses çalınamadı:', e));
}

export function shareEarthquake(eq) {
    const text = `${eq.title} - Büyüklük: ${eq.mag} | Derinlik: ${eq.depth} km | ${formatDate(eq.date, true)}`;

    if (navigator.share) {
        navigator.share({
            title: 'Deprem Bilgisi',
            text: text,
            url: window.location.href
        }).catch(err => {
            console.log('Paylaşım iptal edildi:', err);
        });
    } else {
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
    }
}

export function showEarthquakeDetails(eq) {
    modalTitle.textContent = eq.title;
    modalDate.textContent = formatDate(eq.date, true);
    modalDepth.textContent = `${eq.depth} km`;
    modalLocation.textContent = eq.title;

    // Initialize or clear map
    if (map) {
        map.remove();
    }

    modalMap.innerHTML = '';

    const coords = eq.geojson.coordinates;
    map = L.map('modalMap').setView([coords[1], coords[0]], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([coords[1], coords[0]]).addTo(map)
        .bindPopup(`<b>${eq.title}</b><br>Büyüklük: ${eq.mag}`)
        .openPopup();

    L.circle([coords[1], coords[0]], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.2,
        radius: eq.mag * 15000
    }).addTo(map);

    earthquakeModal.classList.add('show');

    shareBtn.onclick = () => shareEarthquake(eq);

    closeModalBtn.addEventListener('click', () => {
        earthquakeModal.classList.remove('show');
    });

    earthquakeModal.addEventListener('click', (e) => {
        if (e.target === earthquakeModal) {
            earthquakeModal.classList.remove('show');
        }
    });
}

export function checkForNewEarthquakes(earthquakesData, lastNotificationTime) {
    if (!lastNotificationTime) {
        lastNotificationTime = new Date();
        return;
    }

    const newSignificant = earthquakesData.filter(eq => {
        const eqDate = new Date(eq.date);
        return eqDate > lastNotificationTime && eq.mag >= 4.5;
    });

    if (newSignificant.length > 0) {
        lastNotificationTime = new Date();

        const strongestNew = newSignificant.reduce((max, eq) =>
            eq.mag > max.mag ? eq : max, newSignificant[0]);

        showNotification(
            `Yeni Deprem: ${strongestNew.mag}`,
            `${strongestNew.title} - ${formatDate(strongestNew.date)}`
        );

        if (strongestNew.mag >= 5) {
            playAlertSound();
        }
    }
}