// Generate a simple UUID for vehicle IDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to show snackbar
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

// Function to toggle dark mode
function toggleDarkMode() {
    try {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        toggleHamburgerMenu(); // Close menu after action
    } catch (e) {
        console.error('Error in toggleDarkMode:', e);
    }
}

// Function to toggle hamburger menu
function toggleHamburgerMenu() {
    try {
        const menu = document.getElementById('hamburgerMenu');
        const scrim = document.getElementById('scrim');
        if (menu && scrim) {
            const isOpen = menu.style.display === 'flex';
            menu.style.display = isOpen ? 'none' : 'flex';
            scrim.style.display = isOpen ? 'none' : 'block';
            menu.classList.toggle('show');
        }
    } catch (e) {
        console.error('Error in toggleHamburgerMenu:', e);
    }
}

// Function to backup localStorage data
async function backupData() {
    try {
        const data = JSON.stringify(localStorage);
        const blob = new Blob([data], { type: 'application/json' });

        // Generate filename with date and time (e.g., CSART-backup-2025-04-26-12-57-00.json)
        const now = new Date();
        const timestamp = now.getFullYear() + '-' +
                         String(now.getMonth() + 1).padStart(2, '0') + '-' +
                         String(now.getDate()).padStart(2, '0') + '-' +
                         String(now.getHours()).padStart(2, '0') + '-' +
                         String(now.getMinutes()).padStart(2, '0') + '-' +
                         String(now.getSeconds()).padStart(2, '0');
        const filename = `CSART-backup-${timestamp}.json`;

        // Check if running on desktop (basic heuristic: screen width > 600px)
        const isDesktop = window.innerWidth > 600;

        if (isDesktop && window.showSaveFilePicker) {
            // Use File System Access API for desktop save dialog
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
        } else {
            // Fallback for mobile or unsupported browsers
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }

        showSnackbar('Data backed up');
        toggleHamburgerMenu(); // Close menu after action
    } catch (e) {
        console.error('Error in backupData:', e);
        showSnackbar('Backup failed');
    }
}

// Function to restore localStorage data
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
                // Validate data
                if (!data.vehicles || !data.selectedVehicleId || !data.theme) {
                    throw new Error('Invalid backup file: missing required keys');
                }
                // Clear existing localStorage
                localStorage.clear();
                // Restore new data
                Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value));
                // Repair and refresh
                vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
                selectedVehicleId = localStorage.getItem('selectedVehicleId') || null;
                repairVehiclesData();
                renderPage();
                showSnackbar('Data restored');
                toggleHamburgerMenu(); // Close menu after action
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

// Client-side routing
function navigateTo(path) {
    try {
        console.log('Navigating to:', path);
        if (path.startsWith('/vehicle/') && !path.split('/vehicle/')[1]) {
            console.error('Invalid vehicle ID in path:', path);
            showSnackbar('Cannot navigate: Invalid vehicle ID');
            return;
        }
        // Check if running on file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('Using file:// fallback navigation (history.pushState not supported)');
            // Update selectedVehicleId and render directly
            if (path.startsWith('/vehicle/')) {
                selectedVehicleId = path.split('/vehicle/')[1];
            } else {
                selectedVehicleId = null;
            }
            renderPage();
        } else {
            // Normal navigation for http:// or https://
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

function renderPage() {
    try {
        let path = window.location.pathname;
        console.log('Rendering page for path:', path);
        const mainPage = document.getElementById('mainPage');
        const detailPage = document.getElementById('detailPage');
        if (!mainPage || !detailPage) {
            console.error('Main or detail page elements not found');
            return;
        }

        // Normalize path for /carsart
        if (path.startsWith('/carsart')) {
            path = path.replace('/carsart', '');
        }

        if (path === '/' || path === '') {
            mainPage.style.display = 'block';
            detailPage.style.display = 'none';
            renderVehicleList();
        } else if (path.startsWith('/vehicle/')) {
            selectedVehicleId = path.split('/vehicle/')[1];
            mainPage.style.display = 'none';
            detailPage.style.display = 'block';
            renderSelectedVehicle();
        }
    } catch (e) {
        console.error('Error in renderPage:', e);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    if (window.location.protocol === 'file:') {
        console.warn('Running on file:// protocol. Navigation may be limited due to browser security restrictions. For full functionality, serve the app using a local server (e.g., `python -m http.server 8000` or `npx serve`).');
    }
    // Load theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
    // Close hamburger menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('hamburgerMenu');
        const menuButton = document.querySelector('.menu-button');
        const scrim = document.getElementById('scrim');
        if (menu && menuButton && scrim && !menu.contains(e.target) && !menuButton.contains(e.target)) {
            menu.style.display = 'none';
            scrim.style.display = 'none';
            menu.classList.remove('show');
        }
    });
    // Close service detail modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeServiceDetailModal();
        }
    });
    window.addEventListener('popstate', () => {
        console.log('Popstate event triggered');
        renderPage();
    });
    repairVehiclesData();
    renderPage();
});