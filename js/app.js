// DOM Elements
const earthquakeList = document.getElementById('earthquake-list');
const refreshBtn = document.getElementById('refreshBtn');
const themeToggle = document.getElementById('themeToggle');
const infoBtn = document.getElementById('infoBtn');
const filterCheckbox = document.getElementById('filterCheckbox');
const dateFilter = document.getElementById('dateFilter');
const locationFilter = document.getElementById('locationFilter');
const loadingIndicator = document.getElementById('loadingIndicator');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const earthquakeModal = document.getElementById('earthquakeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalDepth = document.getElementById('modalDepth');
const modalLocation = document.getElementById('modalLocation');
const modalMap = document.getElementById('modalMap');
const shareBtn = document.getElementById('shareBtn');
const notification = document.getElementById('notification');
const statsContainer = document.getElementById('statsContainer');
const totalCount = document.getElementById('totalCount');
const strongestMag = document.getElementById('strongestMag');
const averageDepth = document.getElementById('averageDepth');
const alertSound = document.getElementById('alertSound');

// Global variables
let earthquakesData = [];
let map;
let lastUpdateTime = null;
let lastNotificationTime = null;

// Initialize the application
function init() {
    loadData();
    setupEventListeners();
    checkServiceWorker();
    loadThemePreference();
}

// Fetch earthquake data
async function loadData() {
    try {
        showLoading();
        const response = await fetch('https://api.orhanaydogdu.com.tr/deprem/kandilli/live');
        
        if (!response.ok) {
            throw new Error('API yanıt vermedi');
        }
        
        const data = await response.json();
        earthquakesData = data.result;
        lastUpdateTime = new Date();
        
        renderEarthquakes();
        updateStats();
        checkForNewEarthquakes();
        updateLocationFilter();
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        showError('Veriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
        hideLoading();
    }
}

// Render earthquakes based on filters
function renderEarthquakes() {
    const filterEnabled = filterCheckbox.checked;
    const dateFilterValue = dateFilter.value;
    const locationFilterValue = locationFilter.value;
    
    const filtered = earthquakesData.filter(eq => {
        // Magnitude filter
        if (filterEnabled && eq.mag < 4) return false;
        
        // Date filter
        if (dateFilterValue !== 'all') {
            const eqDate = new Date(eq.date);
            const hoursDiff = (new Date() - eqDate) / (1000 * 60 * 60);
            if (hoursDiff > parseInt(dateFilterValue)) return false;
        }
        
        // Location filter
        if (locationFilterValue !== 'all' && !eq.title.includes(locationFilterValue)) {
            return false;
        }
        
        return true;
    });
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear previous results
    earthquakeList.innerHTML = '';
    
    if (filtered.length === 0) {
        earthquakeList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Filtrelerinize uygun deprem bulunamadı</p>
            </div>
        `;
        statsContainer.classList.add('hidden');
        return;
    }
    
    // Show statistics
    statsContainer.classList.remove('hidden');
    
    // Create earthquake cards
    filtered.forEach(eq => {
        const magnitude = parseFloat(eq.mag);
        const color = getMagnitudeColor(magnitude);
        
        const eqCard = document.createElement('div');
        eqCard.className = 'earthquake-card';
        eqCard.style.borderLeftColor = color;
        eqCard.innerHTML = `
            <div class="eq-header">
                <h3>${eq.title}</h3>
                <span class="magnitude-badge" style="background: ${color}">
                    ${magnitude.toFixed(1)}
                </span>
            </div>
            <div class="eq-details">
                <span><i class="fas fa-clock"></i> ${formatDate(eq.date)}</span>
                <span><i class="fas fa-ruler-vertical"></i> ${eq.depth} km</span>
            </div>
        `;
        
        eqCard.addEventListener('click', () => showEarthquakeDetails(eq));
        earthquakeList.appendChild(eqCard);
    });
}

// Show earthquake details in modal
function showEarthquakeDetails(eq) {
    modalTitle.textContent = eq.title;
    modalDate.textContent = formatDate(eq.date, true);
    modalDepth.textContent = `${eq.depth} km`;
    modalLocation.textContent = eq.title;
    
    // Initialize or clear map
    if (map) {
        map.remove();
    }
    
    modalMap.innerHTML = '';
    
    // Create map
    const coords = eq.geojson.coordinates;
    map = L.map('modalMap').setView([coords[1], coords[0]], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add marker
    L.marker([coords[1], coords[0]]).addTo(map)
        .bindPopup(`<b>${eq.title}</b><br>Büyüklük: ${eq.mag}`)
        .openPopup();
    
    // Add circle to show magnitude
    L.circle([coords[1], coords[0]], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.2,
        radius: eq.mag * 15000
    }).addTo(map);
    
    // Show modal
    earthquakeModal.classList.add('show');
    
    // Set up share button
    shareBtn.onclick = () => shareEarthquake(eq);
}

// Update statistics
function updateStats() {
    if (earthquakesData.length === 0) return;
    
    totalCount.textContent = earthquakesData.length;
    
    const magnitudes = earthquakesData.map(eq => parseFloat(eq.mag));
    strongestMag.textContent = Math.max(...magnitudes).toFixed(1);
    
    const depths = earthquakesData.map(eq => parseFloat(eq.depth));
    averageDepth.textContent = (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1);
}

// Check for new significant earthquakes
function checkForNewEarthquakes() {
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

// Update location filter options
function updateLocationFilter() {
    const locations = [...new Set(earthquakesData.map(eq => {
        return eq.title.split(' ')[0];
    }))].sort();
    
    locationFilter.innerHTML = '<option value="all">Tüm Bölgeler</option>';
    
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
}

// Helper functions
function formatDate(dateString, full = false) {
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

function getMagnitudeColor(magnitude) {
    if (magnitude >= 5) return 'var(--danger-color)';
    if (magnitude >= 4) return 'var(--warning-color)';
    return 'var(--success-color)';
}

function showLoading() {
    loadingIndicator.style.display = 'flex';
    earthquakeList.style.display = 'none';
    statsContainer.classList.add('hidden');
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
    earthquakeList.style.display = 'block';
}

function showError(message) {
    earthquakeList.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function showNotification(title, message) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
    
    notification.innerHTML = `<strong>${title}</strong><br>${message}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function playAlertSound() {
    alertSound.currentTime = 0;
    alertSound.play().catch(e => console.log('Ses çalınamadı:', e));
}

function shareEarthquake(eq) {
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
        // Fallback for browsers that don't support Web Share API
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
    }
}

// Event listeners
function setupEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', loadData);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Info button
    infoBtn.addEventListener('click', () => {
        showNotification(
            'Deprem Bilgi Uygulaması',
            'Veriler Kandilli Rasathanesi tarafından sağlanmaktadır.'
        );
    });
    
    // Filters
    filterCheckbox.addEventListener('change', renderEarthquakes);
    dateFilter.addEventListener('change', renderEarthquakes);
    locationFilter.addEventListener('change', renderEarthquakes);
    
    // Scroll to top button
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Close modal button
    closeModalBtn.addEventListener('click', () => {
        earthquakeModal.classList.remove('show');
    });
    
    // Close modal when clicking outside
    earthquakeModal.addEventListener('click', (e) => {
        if (e.target === earthquakeModal) {
            earthquakeModal.classList.remove('show');
        }
    });
    
    // Show/hide scroll to top button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
}

// Theme management
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    themeToggle.innerHTML = isDarkMode ? 
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function loadThemePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Service Worker registration
function checkServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('ServiceWorker registration successful:', registration.scope);
            }).catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);