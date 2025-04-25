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

// Client-side routing
function navigateTo(path) {
    try {
        console.log('Navigating to:', path);
        if (path.startsWith('/vehicle/') && !path.split('/vehicle/')[1]) {
            console.error('Invalid vehicle ID in path:', path);
            showSnackbar('Cannot navigate: Invalid vehicle ID');
            return;
        }
        history.pushState({}, '', path);
        renderPage();
    } catch (e) {
        console.error('Error in navigateTo:', e);
        showSnackbar('Navigation failed');
    }
}

window.addEventListener('popstate', () => {
    console.log('Popstate event triggered');
    renderPage();
});

function renderPage() {
    try {
        const path = window.location.pathname;
        console.log('Rendering page for path:', path);
        const mainPage = document.getElementById('mainPage');
        const detailPage = document.getElementById('detailPage');
        if (!mainPage || !detailPage) {
            console.error('Main or detail page elements not found');
            return;
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

            const viewBtn = document.createElement('button');
            viewBtn.className = 'vehicle-btn';
            viewBtn.innerHTML = '<span class="material-icons">arrow_forward</span>';
            viewBtn.setAttribute('onclick', `navigateTo('/vehicle/${vehicle.id}')`);
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Arrow button clicked:', vehicle.id);
                navigateTo(`/vehicle/${vehicle.id}`);
            });
            buttonsDiv.appendChild(viewBtn);

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
            renderTables();
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
            renderTables();
            showSnackbar('Current information updated');
        }
    } catch (e) {
        console.error('Error in updateCurrentInfo:', e);
    }
}

// Function to clear form fields
function clearCompletedForm() {
    try {
        document.getElementById('compDate').value = '';
        document.getElementById('compDescription').value = '';
        document.getElementById('compShop').value = '';
        document.getElementById('compCost').value = '';
        document.getElementById('compMileage').value = '';
        document.getElementById('compReceipt').value = '';
    } catch (e) {
        console.error('Error in clearCompletedForm:', e);
    }
}

function clearPendingForm() {
    try {
        document.getElementById('pendDescription').value = '';
        document.getElementById('pendDueDate').value = '';
        document.getElementById('pendDueMileage').value = '';
        document.getElementById('pendPriority').value = 'High';
        document.getElementById('pendNotes').value = '';
    } catch (e) {
        console.error('Error in clearPendingForm:', e);
    }
}

// Function to handle completed service submission (add or update)
function submitCompletedService() {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        const submitButton = document.getElementById('compSubmit');
        const isEditing = submitButton.getAttribute('data-editing') === 'true';
        const index = parseInt(submitButton.getAttribute('data-index'));

        const service = {
            date: document.getElementById('compDate').value,
            description: document.getElementById('compDescription').value,
            shop: document.getElementById('compShop').value,
            cost: parseFloat(document.getElementById('compCost').value) || 0,
            mileage: parseInt(document.getElementById('compMileage').value) || 0,
            receipt: document.getElementById('compReceipt').value
        };

        if (service.description && service.date) {
            if (isEditing) {
                updateCompletedService(index, service);
            } else {
                vehicle.completedServices.push(service);
                saveData();
                renderTables();
                showSnackbar('Completed service added');
            }
            clearCompletedForm();
            resetForm('completed');
        } else {
            alert('Please enter at least a date and description.');
        }
    } catch (e) {
        console.error('Error in submitCompletedService:', e);
    }
}

// Function to handle pending service submission (add or update)
function submitPendingService() {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        const submitButton = document.getElementById('pendSubmit');
        const isEditing = submitButton.getAttribute('data-editing') === 'true';
        const index = parseInt(submitButton.getAttribute('data-index'));

        const service = {
            description: document.getElementById('pendDescription').value,
            dueDate: document.getElementById('pendDueDate').value,
            dueMileage: parseInt(document.getElementById('pendDueMileage').value) || 0,
            priority: document.getElementById('pendPriority').value,
            notes: document.getElementById('pendNotes').value
        };

        if (service.description) {
            if (isEditing) {
                updatePendingService(index, service);
            } else {
                vehicle.pendingServices.push(service);
                saveData();
                renderTables();
                showSnackbar('Pending service added');
            }
            clearPendingForm();
            resetForm('pending');
        } else {
            alert('Please enter a description.');
        }
    } catch (e) {
        console.error('Error in submitPendingService:', e);
    }
}

// Function to edit a completed service
function editCompletedService(index) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        const service = vehicle.completedServices[index];
        document.getElementById('compDate').value = service.date;
        document.getElementById('compDescription').value = service.description;
        document.getElementById('compShop').value = service.shop;
        document.getElementById('compCost').value = service.cost;
        document.getElementById('compMileage').value = service.mileage;
        document.getElementById('compReceipt').value = service.receipt;

        const submitButton = document.getElementById('compSubmit');
        submitButton.textContent = 'Update Service';
        submitButton.setAttribute('data-editing', 'true');
        submitButton.setAttribute('data-index', index);
        document.getElementById('compCancel').style.display = 'block';
    } catch (e) {
        console.error('Error in editCompletedService:', e);
    }
}

// Function to edit a pending service
function editPendingService(index) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        const service = vehicle.pendingServices[index];
        document.getElementById('pendDescription').value = service.description;
        document.getElementById('pendDueDate').value = service.dueDate || '';
        document.getElementById('pendDueMileage').value = service.dueMileage || '';
        document.getElementById('pendPriority').value = service.priority;
        document.getElementById('pendNotes').value = service.notes;

        const submitButton = document.getElementById('pendSubmit');
        submitButton.textContent = 'Update Service';
        submitButton.setAttribute('data-editing', 'true');
        submitButton.setAttribute('data-index', index);
        document.getElementById('pendCancel').style.display = 'block';
    } catch (e) {
        console.error('Error in editPendingService:', e);
    }
}

// Function to update a completed service
function updateCompletedService(index, service) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        vehicle.completedServices[index] = service;
        saveData();
        renderTables();
        showSnackbar('Completed service updated');
    } catch (e) {
        console.error('Error in updateCompletedService:', e);
    }
}

// Function to update a pending service
function updatePendingService(index, service) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        vehicle.pendingServices[index] = service;
        saveData();
        renderTables();
        showSnackbar('Pending service updated');
    } catch (e) {
        console.error('Error in updatePendingService:', e);
    }
}

// Function to cancel editing
function cancelEdit(type) {
    try {
        if (type === 'completed') {
            clearCompletedForm();
            resetForm('completed');
        } else {
            clearPendingForm();
            resetForm('pending');
        }
    } catch (e) {
        console.error('Error in cancelEdit:', e);
    }
}

// Function to reset form state
function resetForm(type) {
    try {
        const submitButton = document.getElementById(type === 'completed' ? 'compSubmit' : 'pendSubmit');
        const cancelButton = document.getElementById(type === 'completed' ? 'compCancel' : 'pendCancel');
        submitButton.textContent = 'Add Service';
        submitButton.setAttribute('data-editing', 'false');
        submitButton.setAttribute('data-index', '-1');
        cancelButton.style.display = 'none';
    } catch (e) {
        console.error('Error in resetForm:', e);
    }
}

// Function to delete a completed service
function deleteCompletedService(index) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        vehicle.completedServices.splice(index, 1);
        saveData();
        renderTables();
        showSnackbar('Completed service deleted');
    } catch (e) {
        console.error('Error in deleteCompletedService:', e);
    }
}

// Function to delete a pending service
function deletePendingService(index) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        vehicle.pendingServices.splice(index, 1);
        saveData();
        renderTables();
        showSnackbar('Pending service deleted');
    } catch (e) {
        console.error('Error in deletePendingService:', e);
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

// Function to render both tables
function renderTables() {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        const compBody = document.getElementById('detailCompletedBody');
        compBody.innerHTML = '';
        vehicle.completedServices.forEach((service, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.date}</td>
                <td>${service.description}</td>
                <td>${service.shop}</td>
                <td>₦${service.cost.toFixed(2)}</td>
                <td>${service.mileage}</td>
                <td>${service.receipt}</td>
                <td>
                    <button class="edit-btn" onclick="editCompletedService(${index})"><span class="material-icons">edit</span></button>
                    <button class="delete-btn" onclick="deleteCompletedService(${index})"><span class="material-icons">delete</span></button>
                </td>
            `;
            compBody.appendChild(row);
        });

        const pendBody = document.getElementById('detailPendingBody');
        pendBody.innerHTML = '';
        vehicle.pendingServices.forEach((service, index) => {
            const isDue = isServiceDue(service);
            const row = document.createElement('tr');
            if (isDue) row.classList.add('due');
            row.innerHTML = `
                <td>${service.description}</td>
                <td>${service.dueDate || ''}</td>
                <td>${service.dueMileage || ''}</td>
                <td>${service.priority}</td>
                <td>${service.notes}</td>
                <td>${isDue ? 'Yes' : 'No'}</td>
                <td>
                    <button class="edit-btn" onclick="editPendingService(${index})"><span class="material-icons">edit</span></button>
                    <button class="delete-btn" onclick="deletePendingService(${index})"><span class="material-icons">delete</span></button>
                </td>
            `;
            pendBody.appendChild(row);
        });
    } catch (e) {
        console.error('Error in renderTables:', e);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    // Load theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
    repairVehiclesData();
    renderPage();
});