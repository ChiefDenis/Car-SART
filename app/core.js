function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function showSnackbar(message) {
    try {
        const snackbar = document.getElementById('snackbar');
        if (snackbar) {
            snackbar.textContent = message;
            snackbar.classList.add('show');
            setTimeout(() => snackbar.classList.remove('show'), 3000);
        } else {
            console.warn('Snackbar element not found');
        }
    } catch (e) {
        console.error('Error in showSnackbar:', e);
    }
}

function toggleDarkMode() {
    try {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        updateThemeDropdown();
    } catch (e) {
        console.error('Error in toggleDarkMode:', e);
    }
}

function updateTheme(theme) {
    try {
        document.body.classList.remove('dark');
        if (theme === 'dark') {
            document.body.classList.add('dark');
        }
        localStorage.setItem('theme', theme);
        updateThemeDropdown();
    } catch (e) {
        console.error('Error in updateTheme:', e);
    }
}

function updateThemeDropdown() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.value = localStorage.getItem('theme') || 'light';
    }
}

function updateUnitSystem(unitSystem) {
    try {
        localStorage.setItem('unitSystem', unitSystem);
        updateUnitSystemDropdown();
        renderPage(); // Re-render to update mileage displays
    } catch (e) {
        console.error('Error in updateUnitSystem:', e);
    }
}

function updateUnitSystemDropdown() {
    const unitSystemSelect = document.getElementById('unitSystem');
    if (unitSystemSelect) {
        unitSystemSelect.value = localStorage.getItem('unitSystem') || 'metric';
    }
}

function updateDefaultCurrency(currency) {
    try {
        localStorage.setItem('defaultCurrency', currency);
        updateDefaultCurrencyDropdown();
        renderPage(); // Re-render to update currency displays
    } catch (e) {
        console.error('Error in updateDefaultCurrency:', e);
    }
}

function updateDefaultCurrencyDropdown() {
    const currencySelect = document.getElementById('defaultCurrency');
    if (currencySelect) {
        const savedCurrency = localStorage.getItem('defaultCurrency') || '';
        const optionExists = Array.from(currencySelect.options).some(option => option.value === savedCurrency);
        currencySelect.value = optionExists ? savedCurrency : '';
    }
}

function convertMileage(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    const kmToMiles = 0.621371;
    if (fromUnit === 'metric' && (toUnit === 'uk-imperial' || toUnit === 'us-imperial')) {
        return value * kmToMiles;
    } else if ((fromUnit === 'uk-imperial' || fromUnit === 'us-imperial') && toUnit === 'metric') {
        return value / kmToMiles;
    }
    return value;
}

function getMileageUnit() {
    const unitSystem = localStorage.getItem('unitSystem') || 'metric';
    return unitSystem === 'metric' ? 'km' : 'mi';
}

function formatMileage(value) {
    const unitSystem = localStorage.getItem('unitSystem') || 'metric';
    const convertedValue = convertMileage(value, 'metric', unitSystem);
    return `${Math.round(convertedValue)} ${getMileageUnit()}`;
}

function formatCurrency(value) {
    const currency = localStorage.getItem('defaultCurrency') || '';
    if (!currency) return `${value}`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

function toggleHamburgerMenu() {
    try {
        const menu = document.getElementById('hamburgerMenu');
        const scrim = document.getElementById('scrim');
        if (menu && scrim) {
            menu.classList.toggle('show');
            scrim.classList.toggle('show');
        }
    } catch (e) {
        console.error('Error in toggleHamburgerMenu:', e);
    }
}

async function backupData() {
    try {
        const data = JSON.stringify(localStorage);
        const blob = new Blob([data], { type: 'application/json' });
        const now = new Date();
        const timestamp = now.getFullYear() + '-' +
                         String(now.getMonth() + 1).padStart(2, '0') + '-' +
                         String(now.getDate()).padStart(2, '0') + '-' +
                         String(now.getHours()).padStart(2, '0') + '-' +
                         String(now.getMinutes()).padStart(2, '0') + '-' +
                         String(now.getSeconds()).padStart(2, '0');
        const filename = `CSART-backup-${timestamp}.json`;
        const isDesktop = window.innerWidth > 600;
        if (isDesktop && window.showSaveFilePicker) {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
            });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
        showSnackbar('Data backed up');
        toggleHamburgerMenu();
    } catch (e) {
        console.error('Error in backupData:', e);
        showSnackbar('Backup failed');
    }
}

function restoreData(event) {
    try {
        const file = event.target.files[0];
        if (!file) {
            showSnackbar('No file selected');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.vehicles || !data.selectedVehicleId || !data.theme) {
                    throw new Error('Invalid backup file: missing required keys');
                }
                localStorage.clear();
                Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value));
                vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
                selectedVehicleId = localStorage.getItem('selectedVehicleId') || null;
                repairVehiclesData();
                renderPage();
                showSnackbar('Data restored');
                toggleHamburgerMenu();
            } catch (err) {
                console.error('Error restoring data:', err);
                showSnackbar('Invalid backup file');
            }
        };
        reader.readAsText(file);
    } catch (e) {
        console.error('Error in restoreData:', e);
        showSnackbar('Restore failed');
    }
}

function navigateTo(path) {
    try {
        console.log('Navigating to:', path);
        if (path.startsWith('/vehicle/') && !path.split('/vehicle/')[1]) {
            console.error('Invalid vehicle ID in path:', path);
            showSnackbar('Cannot navigate: Invalid vehicle ID');
            return;
        }
        if (window.location.protocol === 'file:') {
            console.warn('Using file:// fallback navigation (history.pushState not supported)');
            if (path.startsWith('/vehicle/')) {
                selectedVehicleId = path.split('/vehicle/')[1];
            } else {
                selectedVehicleId = null;
            }
            renderPage();
        } else {
            history.pushState({}, '', path);
            renderPage();
        }
    } catch (e) {
        console.error('Error in navigateTo:', e);
        if (e.name === 'SecurityError' && window.location.protocol === 'file:') {
            showSnackbar('Navigation failed: Run the app on a local server (e.g., http://localhost) to enable full navigation');
        } else {
            showSnackbar('Navigation failed');
        }
    }
}

function goBack() {
    try {
        let path = window.location.pathname;
        console.log('Going back from path:', path);
        if (path.startsWith('/carsart')) {
            path = path.replace('/carsart', '');
        }
        if (path.startsWith('/vehicle/')) {
            navigateTo('/vehicles');
        } else if (path === '/settings') {
            navigateTo('/vehicles');
        } else {
            navigateTo('/vehicles'); // Fallback to vehicles page
        }
    } catch (e) {
        console.error('Error in goBack:', e);
        showSnackbar('Navigation failed');
    }
}

function renderPage() {
    try {
        let path = window.location.pathname;
        console.log('Rendering page for path:', path);
        const mainPage = document.getElementById('mainPage');
        const vehiclesPage = document.getElementById('vehiclesPage');
        const detailPage = document.getElementById('detailPage');
        const settingsPage = document.getElementById('settingsPage');
        if (!mainPage || !vehiclesPage || !detailPage || !settingsPage) {
            console.error('Page elements not found');
            return;
        }
        if (path.startsWith('/carsart')) {
            path = path.replace('/carsart', '');
        }
        if (path === '/' || path === '') {
            mainPage.style.display = 'block';
            vehiclesPage.style.display = 'none';
            detailPage.style.display = 'none';
            settingsPage.style.display = 'none';
            renderDashboard();
        } else if (path === '/vehicles') {
            mainPage.style.display = 'none';
            vehiclesPage.style.display = 'block';
            detailPage.style.display = 'none';
            settingsPage.style.display = 'none';
            renderVehicleList();
        } else if (path.startsWith('/vehicle/')) {
            selectedVehicleId = path.split('/vehicle/')[1];
            mainPage.style.display = 'none';
            vehiclesPage.style.display = 'none';
            detailPage.style.display = 'block';
            settingsPage.style.display = 'none';
            renderSelectedVehicle();
        } else if (path === '/settings') {
            mainPage.style.display = 'none';
            vehiclesPage.style.display = 'none';
            detailPage.style.display = 'none';
            settingsPage.style.display = 'block';
            updateThemeDropdown();
            updateUnitSystemDropdown();
            updateDefaultCurrencyDropdown();
        }
    } catch (e) {
        console.error('Error in renderPage:', e);
    }
}

function renderDashboard() {
    try {
        const totalVehicles = document.getElementById('totalVehicles');
        const totalPendingServices = document.getElementById('totalPendingServices');
        const totalServiceCost = document.getElementById('totalServiceCost');
        const recentActivityList = document.getElementById('recentActivity');
        if (!totalVehicles || !totalPendingServices || !totalServiceCost || !recentActivityList) {
            console.error('Dashboard elements not found');
            return;
        }

        // Calculate totals
        const vehicleCount = vehicles.length;
        const pendingServiceCount = vehicles.reduce((sum, vehicle) => sum + (vehicle.pendingServices || []).length, 0);
        const totalCost = vehicles.reduce((sum, vehicle) => {
            return sum + (vehicle.completedServices || []).reduce((subSum, service) => subSum + (parseFloat(service.cost) || 0), 0);
        }, 0);

        // Update summary
        totalVehicles.textContent = vehicleCount;
        totalPendingServices.textContent = pendingServiceCount;
        totalServiceCost.textContent = formatCurrency(totalCost);

        // Populate recent activity
        recentActivityList.innerHTML = '';
        const allServices = [];
        vehicles.forEach(vehicle => {
            (vehicle.completedServices || []).forEach(service => {
                allServices.push({
                    vehicleId: vehicle.id,
                    vehicleName: vehicle.name,
                    service: { ...service, date: new Date(service.date) }
                });
            });
        });

        // Sort services by date (newest first) and take top 3
        allServices.sort((a, b) => b.service.date - a.service.date);
        const recentServices = allServices.slice(0, 3);

        if (recentServices.length === 0) {
            recentActivityList.innerHTML = '<p style="padding: 16px;">No recent activity</p>';
        } else {
            recentServices.forEach(({ vehicleId, vehicleName, service }) => {
                const serviceItem = document.createElement('div');
                serviceItem.className = 'recent-service-item';
                serviceItem.setAttribute('data-vehicle-id', vehicleId);
                const description = service.description || 'Unnamed service';
                // Assume priority is not tracked for completed services; use 'Low' as default if needed
                const priority = service.priority || 'Low';
                serviceItem.innerHTML = `
                    <span class="material-icons">build</span>
                    <div class="priority-dot priority-${priority.toLowerCase()}"></div>
                    <span>${description} on ${vehicleName} - ${service.date.toLocaleDateString()}</span>
                `;
                serviceItem.addEventListener('click', () => {
                    navigateTo(`/vehicle/${vehicleId}`);
                });
                recentActivityList.appendChild(serviceItem);
            });
        }
    } catch (e) {
        console.error('Error in renderDashboard:', e);
        showSnackbar('Failed to render dashboard');
    }
}

function updateActiveNavItem(target) {
    const navItems = document.querySelectorAll('.mdc-bottom-navigation__item');
    navItems.forEach(item => item.classList.remove('mdc-bottom-navigation__item--active'));
    target.classList.add('mdc-bottom-navigation__item--active');
}

function navigateToMainPage() {
    try {
        const mainPage = document.getElementById('mainPage');
        const vehiclesPage = document.getElementById('vehiclesPage');
        const detailPage = document.getElementById('detailPage');
        const settingsPage = document.getElementById('settingsPage');
        mainPage.style.display = 'block';
        vehiclesPage.style.display = 'none';
        detailPage.style.display = 'none';
        settingsPage.style.display = 'none';
        renderDashboard();
        updateActiveNavItem(document.querySelector('.mdc-bottom-navigation__item[aria-label="Navigate to Home"]'));
        navigateTo('/');
    } catch (e) {
        console.error('Error in navigateToMainPage:', e);
        showSnackbar('Navigation failed');
    }
}

function navigateToVehiclesPage() {
    try {
        const mainPage = document.getElementById('mainPage');
        const vehiclesPage = document.getElementById('vehiclesPage');
        const detailPage = document.getElementById('detailPage');
        const settingsPage = document.getElementById('settingsPage');
        mainPage.style.display = 'none';
        vehiclesPage.style.display = 'block';
        detailPage.style.display = 'none';
        settingsPage.style.display = 'none';
        renderVehicleList();
        updateActiveNavItem(document.querySelector('.mdc-bottom-navigation__item[aria-label="Navigate to Vehicles"]'));
        navigateTo('/vehicles');
    } catch (e) {
        console.error('Error in navigateToVehiclesPage:', e);
        showSnackbar('Navigation failed');
    }
}

function navigateToShop() {
    try {
        showSnackbar('Shop feature coming soon!');
        updateActiveNavItem(document.querySelector('.mdc-bottom-navigation__item[aria-label="Navigate to Shop"]'));
    } catch (e) {
        console.error('Error in navigateToShop:', e);
        showSnackbar('Navigation failed');
    }
}

function navigateToNotifications() {
    try {
        showSnackbar('Notifications feature coming soon!');
        updateActiveNavItem(document.querySelector('.mdc-bottom-navigation__item[aria-label="Navigate to Notifications"]'));
    } catch (e) {
        console.error('Error in navigateToNotifications:', e);
        showSnackbar('Navigation failed');
    }
}

function navigateToSettings() {
    try {
        updateActiveNavItem(document.querySelector('.mdc-bottom-navigation__item[aria-label="Navigate to Settings"]'));
        navigateTo('/settings');
        toggleHamburgerMenu();
    } catch (e) {
        console.error('Error in navigateToSettings:', e);
        showSnackbar('Navigation failed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    if (window.location.protocol === 'file:') {
        console.warn('Running on file:// protocol. Navigation may be limited due to browser security restrictions. For full functionality, serve the app using a local server (e.g., `python -m http.server 8000` or `npx serve`).');
    }
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('hamburgerMenu');
        const menuButton = document.querySelector('.menu-button');
        const scrim = document.getElementById('scrim');
        if (menu && menuButton && scrim && !menu.contains(e.target) && !menuButton.contains(e.target)) {
            menu.classList.remove('show');
            scrim.classList.remove('show');
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeServiceDetailModal();
        }
    });
    const returnToTopButton = document.getElementById('return-to-top');
    if (returnToTopButton) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const pageHeight = window.innerHeight;
            if (scrollPosition > pageHeight / 2) {
                returnToTopButton.classList.add('show');
            } else {
                returnToTopButton.classList.remove('show');
            }
        });
        returnToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    } else {
        console.warn('Return to Top button not found');
    }
    window.addEventListener('popstate', () => {
        console.log('Popstate event triggered');
        renderPage();
    });
    repairVehiclesData();
    renderPage();
});