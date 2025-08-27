// js/render.js
import { formatDate, getMagnitudeColor, showEarthquakeDetails } from './utils.js';

const earthquakeList = document.getElementById('earthquake-list');
const statsContainer = document.getElementById('statsContainer');
const totalCount = document.getElementById('totalCount');
const strongestMag = document.getElementById('strongestMag');
const averageDepth = document.getElementById('averageDepth');
const locationFilter = document.getElementById('locationFilter');

export function renderEarthquakes(data) {
    earthquakeList.innerHTML = '';

    if (data.length === 0) {
        earthquakeList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Filtrelerinize uygun deprem bulunamadı</p>
            </div>
        `;
        statsContainer.classList.add('hidden');
        return;
    }

    // Sort by date (newest first)
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    data.forEach(eq => {
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

export function renderStats(data) {
    if (data.length === 0) {
        statsContainer.classList.add('hidden');
        return;
    }

    statsContainer.classList.remove('hidden');

    const magnitudes = data.map(eq => parseFloat(eq.mag));
    const depths = data.map(eq => parseFloat(eq.depth));

    totalCount.textContent = data.length;
    strongestMag.textContent = Math.max(...magnitudes).toFixed(1);
    averageDepth.textContent = (depths.reduce((a, b) => a + b, 0) / depths.length).toFixed(1);
}

export function setupLocationFilter(data) {
    const locations = [...new Set(data.map(eq => {
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