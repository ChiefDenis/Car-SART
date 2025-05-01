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
                clearServiceForm('completed');
                closeServiceModal();
                renderSelectedVehicle(); // Call renderSelectedVehicle to update the UI
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
                clearServiceForm('pending');
                closeServiceModal();
                renderSelectedVehicle(); // Call renderSelectedVehicle to update the UI
            } else {
                alert('Please enter a description.');
            }
        }
    } catch (e) {
        console.error('Error in submitService:', e);
    }
}