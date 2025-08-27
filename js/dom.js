// js/dom.js
import { fetchDataAndRender } from './main.js';
import { showNotification } from './utils.js';

const refreshBtn = document.getElementById('refreshBtn');
const themeToggle = document.getElementById('themeToggle');
const infoBtn = document.getElementById('infoBtn');
const filterCheckbox = document.getElementById('filterCheckbox');
const dateFilter = document.getElementById('dateFilter');
const locationFilter = document.getElementById('locationFilter');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const disclaimerModal = document.getElementById('disclaimerModal');
const closeDisclaimerBtn = document.getElementById('closeDisclaimerBtn');

export function setupEventListeners(earthquakesData, applyFilters) {
    // Refresh button
    refreshBtn.addEventListener('click', fetchDataAndRender);

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Info button
    infoBtn.addEventListener('click', () => {
        showNotification(
            'Deprem Bilgi Uygulaması',
            'Bu uygulama resmi bir kurum değildir. Veriler Kandilli Rasathanesi tarafından sağlanmaktadır. Hiçbir ticari amaç güdülmemektedir.'
        );
    });

    // Filters
    filterCheckbox.addEventListener('change', applyFilters);
    dateFilter.addEventListener('change', applyFilters);
    locationFilter.addEventListener('change', applyFilters);

    // Scroll to top button
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Close disclaimer button
    closeDisclaimerBtn.addEventListener('click', hideDisclaimerModal);

    // Show/hide scroll to top button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
}

export function showDisclaimerModal() {
    disclaimerModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

export function hideDisclaimerModal() {
    disclaimerModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

export function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    themeToggle.innerHTML = isDarkMode ?
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

export function initTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}