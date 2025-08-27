// js/main.js
import { loadData } from './api.js';
import { renderEarthquakes, renderStats, setupLocationFilter } from './render.js';
import { checkForNewEarthquakes } from './utils.js';
import { setupEventListeners, showDisclaimerModal, hideDisclaimerModal, toggleTheme, initTheme } from './dom.js';

let earthquakesData = [];
let lastNotificationTime = null;

// Initialize the application
async function init() {
    await fetchDataAndRender();
    setupEventListeners(earthquakesData, applyFilters);
    initTheme();

    if (!localStorage.getItem('disclaimerShown')) {
        showDisclaimerModal();
        localStorage.setItem('disclaimerShown', 'true');
    }
}

// Fetch data, store, and render
export async function fetchDataAndRender() {
    const data = await loadData();
    if (data) {
        earthquakesData = data;
        lastNotificationTime = new Date();
        applyFilters();
        checkForNewEarthquakes(earthquakesData, lastNotificationTime);
        setupLocationFilter(earthquakesData);
    }
}

// Apply filters and render
export function applyFilters() {
    const filterCheckbox = document.getElementById('filterCheckbox');
    const dateFilter = document.getElementById('dateFilter');
    const locationFilter = document.getElementById('locationFilter');

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

    renderEarthquakes(filtered);
    renderStats(filtered);
}

document.addEventListener('DOMContentLoaded', init);