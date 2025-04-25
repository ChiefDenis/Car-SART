// Initialize data from localStorage with error handling
let vehicles = [];
try {
    const storedVehicles = localStorage.getItem('vehicles');
    if (storedVehicles) {
        vehicles = JSON.parse(storedVehicles);
        if (!Array.isArray(vehicles)) {
            console.error('Stored vehicles is not an array:', vehicles);
            vehicles = [];
        }
    }
} catch (e) {
    console.error('Error parsing localStorage vehicles:', e);
    vehicles = [];
}
let selectedVehicleId = localStorage.getItem('selectedVehicleId') || null;

// Function to repair vehicles data
function repairVehiclesData() {
    try {
        vehicles = vehicles.map((vehicle, index) => {
            if (!vehicle || typeof vehicle !== 'object') {
                console.warn(`Invalid vehicle at index ${index}, skipping`);
                return null;
            }
            if (!vehicle.id) {
                console.warn(`Vehicle at index ${index} missing ID, generating new one`);
                vehicle.id = generateUUID();
            }
            return {
                id: vehicle.id,
                name: vehicle.name || `Vehicle ${index + 1}`,
                notes: vehicle.notes || '',
                currentInfo: vehicle.currentInfo || { date: new Date().toISOString().split('T')[0], mileage: 0 },
                completedServices: Array.isArray(vehicle.completedServices) ? vehicle.completedServices : [],
                pendingServices: Array.isArray(vehicle.pendingServices) ? vehicle.pendingServices : []
            };
        }).filter(v => v !== null);
        saveData();
        console.log('Repaired vehicles:', vehicles);
        renderVehicleList(); // Refresh list after repair
    } catch (e) {
        console.error('Error in repairVehiclesData:', e);
    }
}

// Generate a simple UUID for vehicle IDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Function to save data to localStorage
function saveData() {
    try {
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        localStorage.setItem('selectedVehicleId', selectedVehicleId);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// Function to get the selected vehicle
function getSelectedVehicle() {
    return vehicles.find(v => v.id === selectedVehicleId) || null;
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
    } catch (e) {
        console.error('Error in toggleDarkMode:', e);
    }
}

// Function to toggle hamburger menu
function toggleHamburgerMenu() {
    try {
        const menu = document.getElementById('hamburgerMenu');
        if (menu) {
            menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
            menu.classList.toggle('show');
        }
    } catch (e) {
        console.error('Error in toggleHamburgerMenu:', e);
    }
}

// Function to backup localStorage data
function backupData() {
    try {
        const data = JSON.stringify(localStorage);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup.json';
        a.click();
        URL.revokeObjectURL(url);
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

window.addEventListener('popstate', () => {
    console.log('Popstate event triggered');
    renderPage();
});

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

// Function to open vehicle modal
function openVehicleModal(index = -1) {
    try {
        const modal = document.getElementById('vehicleModal');
        const submitButton = document.getElementById('vehicleSubmit');
        const cancelButton = document.getElementById('vehicleCancel');
        const title = document.getElementById('vehicleModalTitle');
        if (!modal || !submitButton || !cancelButton || !title) {
            console.error('Modal elements not found');
            return;
        }

        if (index >= 0) {
            const vehicle = vehicles[index];
            document.getElementById('vehicleName').value = vehicle.name;
            document.getElementById('vehicleNotes').value = vehicle.notes;
            submitButton.textContent = 'Update Vehicle';
            submitButton.setAttribute('data-editing', 'true');
            submitButton.setAttribute('data-index', index);
            cancelButton.style.display = 'block';
            title.textContent = 'Edit Vehicle';
        } else {
            document.getElementById('vehicleName').value = '';
            document.getElementById('vehicleNotes').value = '';
            submitButton.textContent = 'Add Vehicle';
            submitButton.setAttribute('data-editing', 'false');
            submitButton.setAttribute('data-index', '-1');
            cancelButton.style.display = 'none';
            title.textContent = 'Add Vehicle';
        }

        modal.style.display = 'flex';
    } catch (e) {
        console.error('Error in openVehicleModal:', e);
    }
}

// Function to close vehicle modal
function closeVehicleModal() {
    try {
        const modal = document.getElementById('vehicleModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('vehicleName').value = '';
            document.getElementById('vehicleNotes').value = '';
        }
    } catch (e) {
        console.error('Error in closeVehicleModal:', e);
    }
}

// Function to submit a vehicle (add or update)
function submitVehicle() {
    try {
        const submitButton = document.getElementById('vehicleSubmit');
        const isEditing = submitButton.getAttribute('data-editing') === 'true';
        const index = parseInt(submitButton.getAttribute('data-index'));

        const vehicle = {
            name: document.getElementById('vehicleName').value,
            notes: document.getElementById('vehicleNotes').value
        };

        if (vehicle.name) {
            if (isEditing) {
                vehicles[index].name = vehicle.name;
                vehicles[index].notes = vehicle.notes;
                saveData();
                renderVehicleList();
                if (selectedVehicleId === vehicles[index].id) {
                    renderSelectedVehicle();
                }
                showSnackbar('Vehicle updated');
            } else {
                vehicle.id = generateUUID();
                vehicle.currentInfo = { date: new Date().toISOString().split('T')[0], mileage: 0 };
                vehicle.completedServices = [];
                vehicle.pendingServices = [];
                vehicles.push(vehicle);
                saveData();
                renderVehicleList();
                showSnackbar('Vehicle added');
            }
            closeVehicleModal();
        } else {
            alert('Please enter a vehicle name.');
        }
    } catch (e) {
        console.error('Error in submitVehicle:', e);
    }
}

// Function to edit a vehicle
function editVehicle(index) {
    try {
        openVehicleModal(index);
    } catch (e) {
        console.error('Error in editVehicle:', e);
    }
}

// Function to delete a vehicle
function deleteVehicle(index) {
    try {
        if (confirm('Are you sure you want to delete this vehicle and all its service records?')) {
            const vehicleId = vehicles[index].id;
            vehicles.splice(index, 1);
            if (selectedVehicleId === vehicleId) {
                selectedVehicleId = vehicles.length > 0 ? vehicles[0].id : null;
                navigateTo('/');
            }
            saveData();
            renderVehicleList();
            showSnackbar('Vehicle deleted');
        }
    } catch (e) {
        console.error('Error in deleteVehicle:', e);
    }
}

// Function to render vehicle list
function renderVehicleList() {
    try {
        console.log('Rendering vehicle list, vehicles:', vehicles);
        let vehicleList = document.getElementById('vehicleList');
        if (!vehicleList) {
            console.warn('vehicleList element not found, retrying...');
            setTimeout(renderVehicleList, 100); // Retry after 100ms
            return;
        }
        vehicleList.innerHTML = '';
        if (vehicles.length === 0) {
            console.log('No vehicles, showing "No vehicles added yet"');
            vehicleList.innerHTML = '<p class="no-vehicle">No vehicles added yet.</p>';
            return;
        }

        vehicles.forEach((vehicle, index) => {
            if (!vehicle.id || !vehicle.name) {
                console.error('Vehicle missing ID or name:', vehicle);
                return;
            }

            console.log('Rendering vehicle:', vehicle.id, vehicle.name);
            const card = document.createElement('div');
            card.className = 'vehicle-card';
            card.setAttribute('onclick', `navigateTo('/vehicle/${vehicle.id}')`);
            card.addEventListener('click', (e) => {
                console.log('Vehicle card clicked:', vehicle.id);
                navigateTo(`/vehicle/${vehicle.id}`);
            });

            const infoDiv = document.createElement('div');
            const nameP = document.createElement('p');
            nameP.textContent = vehicle.name;
            infoDiv.appendChild(nameP);
            if (vehicle.notes) {
                const notesP = document.createElement('p');
                notesP.className = 'notes';
                notesP.textContent = vehicle.notes;
                infoDiv.appendChild(notesP);
            }

            const buttonsDiv = document.createElement('div');

            const editBtn = document.createElement('button');
            editBtn.className = 'vehicle-btn edit';
            editBtn.innerHTML = '<span class="material-icons">edit</span>';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editVehicle(index);
            });
            buttonsDiv.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'vehicle-btn delete';
            deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteVehicle(index);
            });
            buttonsDiv.appendChild(deleteBtn);

            card.appendChild(infoDiv);
            card.appendChild(buttonsDiv);
            vehicleList.appendChild(card);
        });
    } catch (e) {
        console.error('Error in renderVehicleList:', e);
    }
}

// Function to render selected vehicle’s data
function renderSelectedVehicle() {
    try {
        const vehicle = getSelectedVehicle();
        if (vehicle) {
            document.getElementById('detailVehicleName').textContent = vehicle.name;
            document.getElementById('detailVehicleNotes').textContent = vehicle.notes || '';
            document.getElementById('currentDate').value = vehicle.currentInfo.date;
            document.getElementById('currentMileage').value = vehicle.currentInfo.mileage;
            renderServicesTable();
        } else {
            console.error('No vehicle found for ID:', selectedVehicleId);
            showSnackbar('Vehicle not found');
            navigateTo('/');
        }
    } catch (e) {
        console.error('Error in renderSelectedVehicle:', e);
    }
}

// Function to update current date and mileage
function updateCurrentInfo() {
    try {
        const vehicle = getSelectedVehicle();
        if (vehicle) {
            vehicle.currentInfo.date = document.getElementById('currentDate').value;
            vehicle.currentInfo.mileage = parseInt(document.getElementById('currentMileage').value) || 0;
            saveData();
            renderServicesTable();
            showSnackbar('Current information updated');
        }
    } catch (e) {
        console.error('Error in updateCurrentInfo:', e);
    }
}

// Service modal functions
function openServiceModal(type = null, index = -1) {
    try {
        const modal = document.getElementById('serviceModal');
        const formContainer = document.getElementById('serviceFormContainer');
        if (!modal || !formContainer) {
            console.error('Service modal elements not found');
            return;
        }

        // Set radio button
        const selectedType = type || 'pending';
        document.querySelector(`input[name="serviceType"][value="${selectedType}"]`).checked = true;

        // Load form
        renderServiceForm(selectedType, index);

        // Set modal state for editing
        const submitButton = formContainer.querySelector('#serviceSubmit');
        if (index >= 0) {
            submitButton.textContent = 'Update Service';
            submitButton.setAttribute('data-editing', 'true');
            submitButton.setAttribute('data-index', index);
            formContainer.querySelector('#serviceCancel').style.display = 'block';
        } else {
            submitButton.textContent = 'Add Service';
            submitButton.setAttribute('data-editing', 'false');
            submitButton.setAttribute('data-index', '-1');
            formContainer.querySelector('#serviceCancel').style.display = 'none';
        }

        modal.style.display = 'flex';
    } catch (e) {
        console.error('Error in openServiceModal:', e);
    }
}

function closeServiceModal() {
    try {
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('serviceFormContainer').innerHTML = '';
            document.querySelector('input[name="serviceType"][value="pending"]').checked = true;
        }
    } catch (e) {
        console.error('Error in closeServiceModal:', e);
    }
}

function handleServiceTypeChange(type) {
    try {
        const formContainer = document.getElementById('serviceFormContainer');
        const isEditing = formContainer.querySelector('#serviceSubmit')?.getAttribute('data-editing') === 'true';
        const index = parseInt(formContainer.querySelector('#serviceSubmit')?.getAttribute('data-index') || '-1');
        renderServiceForm(type, isEditing ? index : -1);
    } catch (e) {
        console.error('Error in handleServiceTypeChange:', e);
    }
}

function renderServiceForm(type, index) {
    try {
        const formContainer = document.getElementById('serviceFormContainer');
        if (!formContainer) return;

        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        let formHTML = '';
        if (type === 'completed') {
            const service = index >= 0 ? vehicle.completedServices[index] : {};
            formHTML = `
                <div class="form-group">
                    <input type="date" id="serviceDate" class="material-input" value="${service.date || ''}" required>
                    <label for="serviceDate">Date</label>
                </div>
                <div class="form-group">
                    <input type="text" id="serviceDescription" class="material-input" placeholder=" " value="${service.description || ''}" required>
                    <label for="serviceDescription">Description</label>
                </div>
                <div class="form-group">
                    <input type="text" id="serviceShop" class="material-input" placeholder=" " value="${service.shop || ''}">
                    <label for="serviceShop">Shop</label>
                </div>
                <div class="form-group">
                    <input type="number" id="serviceCost" class="material-input" min="0" step="0.01" placeholder=" " value="${service.cost || ''}">
                    <label for="serviceCost">Cost (₦)</label>
                </div>
                <div class="form-group">
                    <input type="number" id="serviceMileage" class="material-input" min="0" placeholder=" " value="${service.mileage || ''}">
                    <label for="serviceMileage">Mileage</label>
                </div>
                <div class="form-group">
                    <input type="text" id="serviceReceipt" class="material-input" placeholder=" " value="${service.receipt || ''}">
                    <label for="serviceReceipt">Receipt #</label>
                </div>
                <div class="form-buttons">
                    <button class="material-button" id="serviceSubmit" data-editing="false" data-index="-1" onclick="submitService('completed')">Add Service</button>
                    <button class="material-button cancel-btn" id="serviceCancel" onclick="cancelEdit('completed')" style="display: none;">Cancel</button>
                </div>
            `;
        } else {
            const service = index >= 0 ? vehicle.pendingServices[index] : {};
            formHTML = `
                <div class="form-group">
                    <input type="text" id="serviceDescription" class="material-input" placeholder=" " value="${service.description || ''}" required>
                    <label for="serviceDescription">Description</label>
                </div>
                <div class="form-group">
                    <input type="date" id="serviceDueDate" class="material-input" placeholder=" " value="${service.dueDate || ''}">
                    <label for="serviceDueDate">Due Date</label>
                </div>
                <div class="form-group">
                    <input type="number" id="serviceDueMileage" class="material-input" min="0" placeholder=" " value="${service.dueMileage || ''}">
                    <label for="serviceDueMileage">Due Mileage</label>
                </div>
                <div class="form-group">
                    <select id="servicePriority" class="material-input">
                        <option value="High" ${service.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Medium" ${service.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Low" ${service.priority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                    <label for="servicePriority">Priority</label>
                </div>
                <div class="form-group">
                    <input type="text" id="serviceNotes" class="material-input" placeholder=" " value="${service.notes || ''}">
                    <label for="serviceNotes">Notes</label>
                </div>
                <div class="form-buttons">
                    <button class="material-button" id="serviceSubmit" data-editing="false" data-index="-1" onclick="submitService('pending')">Add Service</button>
                    <button class="material-button cancel-btn" id="serviceCancel" onclick="cancelEdit('pending')" style="display: none;">Cancel</button>
                </div>
            `;
        }

        formContainer.innerHTML = formHTML;

        // Restore editing state
        if (index >= 0) {
            const submitButton = formContainer.querySelector('#serviceSubmit');
            submitButton.textContent = 'Update Service';
            submitButton.setAttribute('data-editing', 'true');
            submitButton.setAttribute('data-index', index);
            formContainer.querySelector('#serviceCancel').style.display = 'block';
        }
    } catch (e) {
        console.error('Error in renderServiceForm:', e);
    }
}

// Function to clear form fields
function clearServiceForm(type) {
    try {
        if (type === 'completed') {
            document.getElementById('serviceDate').value = '';
            document.getElementById('serviceDescription').value = '';
            document.getElementById('serviceShop').value = '';
            document.getElementById('serviceCost').value = '';
            document.getElementById('serviceMileage').value = '';
            document.getElementById('serviceReceipt').value = '';
        } else {
            document.getElementById('serviceDescription').value = '';
            document.getElementById('serviceDueDate').value = '';
            document.getElementById('serviceDueMileage').value = '';
            document.getElementById('servicePriority').value = 'High';
            document.getElementById('serviceNotes').value = '';
        }
    } catch (e) {
        console.error('Error in clearServiceForm:', e);
    }
}

// Function to handle service submission
function submitService(type) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        const submitButton = document.getElementById('serviceSubmit');
        const isEditing = submitButton.getAttribute('data-editing') === 'true';
        const index = parseInt(submitButton.getAttribute('data-index'));

        if (type === 'completed') {
            const service = {
                date: document.getElementById('serviceDate').value,
                description: document.getElementById('serviceDescription').value,
                shop: document.getElementById('serviceShop').value,
                cost: parseFloat(document.getElementById('serviceCost').value) || 0,
                mileage: parseInt(document.getElementById('serviceMileage').value) || 0,
                receipt: document.getElementById('serviceReceipt').value
            };

            if (service.description && service.date) {
                if (isEditing) {
                    vehicle.completedServices[index] = service;
                    showSnackbar('Completed service updated');
                } else {
                    vehicle.completedServices.push(service);
                    showSnackbar('Completed service added');
                }
                saveData();
                renderServicesTable();
                clearServiceForm('completed');
                closeServiceModal();
            } else {
                alert('Please enter at least a date and description.');
            }
        } else {
            const service = {
                description: document.getElementById('serviceDescription').value,
                dueDate: document.getElementById('serviceDueDate').value,
                dueMileage: parseInt(document.getElementById('serviceDueMileage').value) || 0,
                priority: document.getElementById('servicePriority').value,
                notes: document.getElementById('serviceNotes').value
            };

            if (service.description) {
                if (isEditing) {
                    vehicle.pendingServices[index] = service;
                    showSnackbar('Pending service updated');
                } else {
                    vehicle.pendingServices.push(service);
                    showSnackbar('Pending service added');
                }
                saveData();
                renderServicesTable();
                clearServiceForm('pending');
                closeServiceModal();
            } else {
                alert('Please enter a description.');
            }
        }
    } catch (e) {
        console.error('Error in submitService:', e);
    }
}

// Function to edit a service
function editService(type, index) {
    try {
        openServiceModal(type, index);
    } catch (e) {
        console.error('Error in editService:', e);
    }
}

// Function to delete a service
function deleteService(type, index) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        if (confirm('Are you sure you want to delete this service?')) {
            if (type === 'completed') {
                vehicle.completedServices.splice(index, 1);
                showSnackbar('Completed service deleted');
            } else {
                vehicle.pendingServices.splice(index, 1);
                showSnackbar('Pending service deleted');
            }
            saveData();
            renderServicesTable();
        }
    } catch (e) {
        console.error('Error in deleteService:', e);
    }
}

// Function to cancel editing
function cancelEdit(type) {
    try {
        clearServiceForm(type);
        closeServiceModal();
    } catch (e) {
        console.error('Error in cancelEdit:', e);
    }
}

// Function to check if a pending service is due
function isServiceDue(service) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return false;

        const today = new Date(vehicle.currentInfo.date);
        const dueDate = service.dueDate ? new Date(service.dueDate) : null;
        const currentMileage = vehicle.currentInfo.mileage;
        const dueMileage = service.dueMileage;

        return (dueDate && dueDate <= today) || (dueMileage && dueMileage <= currentMileage);
    } catch (e) {
        console.error('Error in isServiceDue:', e);
        return false;
    }
}

// Function to export table to CSV
function exportToCSV(tableId, filename) {
    try {
        const table = document.getElementById(tableId);
        const rows = Array.from(table.querySelectorAll('tr'));
        const csv = rows.map(row => 
            Array.from(row.querySelectorAll('th, td'))
                .filter(cell => !cell.querySelector('button'))
                .map(cell => {
                    if (cell.textContent.startsWith('₦')) {
                        return `"${cell.textContent.replace('₦', '')}"`;
                    }
                    return `"${cell.textContent}"`;
                })
                .join(',')
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showSnackbar(`Exported ${filename}`);
    } catch (e) {
        console.error('Error in exportToCSV:', e);
    }
}

// Function to render services table
function renderServicesTable() {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        const services = [
            ...vehicle.pendingServices.map((s, index) => ({ ...s, type: 'pending', index })),
            ...vehicle.completedServices.map((s, index) => ({ ...s, type: 'completed', index }))
        ];

        // Sort: Pending first, then by priority (High=1, Medium=2, Low=3), then by date descending for Completed
        services.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'pending' ? -1 : 1;
            }
            if (a.type === 'pending') {
                const priorityOrder = { High: 1, Medium: 2, Low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(b.date) - new Date(a.date);
        });

        const servicesBody = document.getElementById('detailServicesBody');
        servicesBody.innerHTML = '';
        services.forEach(service => {
            const isDue = service.type === 'pending' && isServiceDue(service);
            const row = document.createElement('tr');
            if (isDue) row.classList.add('due');
            row.innerHTML = `
                <td>${service.type.charAt(0).toUpperCase() + service.type.slice(1)}</td>
                <td>${service.description}</td>
                <td>${service.type === 'pending' ? (service.dueDate || '') : (service.date || '')}</td>
                <td>${service.type === 'pending' ? (service.dueMileage || '') : (service.mileage || '')}</td>
                <td>${service.type === 'pending' ? (service.priority || '') : ''}</td>
                <td>${service.type === 'completed' ? `₦${(service.cost || 0).toFixed(2)}` : ''}</td>
                <td>${service.type === 'completed' ? (service.shop || '') : ''}</td>
                <td>${service.type === 'completed' ? (service.receipt || '') : ''}</td>
                <td>${service.type === 'pending' ? (service.notes || '') : ''}</td>
                <td>${service.type === 'pending' ? (isDue ? 'Yes' : 'No') : ''}</td>
                <td>
                    <button class="edit-btn" onclick="editService('${service.type}', ${service.index})"><span class="material-icons">edit</span></button>
                    <button class="delete-btn" onclick="deleteService('${service.type}', ${service.index})"><span class="material-icons">delete</span></button>
                </td>
            `;
            servicesBody.appendChild(row);
        });
    } catch (e) {
        console.error('Error in renderServicesTable:', e);
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
        if (menu && menuButton && !menu.contains(e.target) && !menuButton.contains(e.target)) {
            menu.style.display = 'none';
            menu.classList.remove('show');
        }
    });
    repairVehiclesData();
    renderPage();
});