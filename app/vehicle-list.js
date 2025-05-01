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