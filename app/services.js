let currentServiceType = null;
let currentServiceIndex = -1;

// Function to export service records to PDF
function exportServiceRecordsToPDF() {
    try {
        // Get the current vehicle
        const vehicle = getSelectedVehicle();
        if (!vehicle) {
            showSnackbar('No vehicle selected');
            return;
        }

        // Combine pending and completed services
        const services = [
            ...vehicle.pendingServices.map((s, index) => ({ ...s, type: 'pending', index })),
            ...vehicle.completedServices.map((s, index) => ({ ...s, type: 'completed', index }))
        ];

        if (services.length === 0) {
            showSnackbar('No service records to export');
            return;
        }

        // Sort services (same logic as renderServicesList)
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

        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Set the font to Times to better support Unicode characters
        doc.setFont("times", "normal");

        // Add header
        const vehicleName = document.getElementById('detailVehicleName').textContent || 'Unnamed Vehicle';
        const exportDate = new Date().toISOString().split('T')[0]; // e.g., 2025-05-01
        doc.setFontSize(16);
        doc.text(`Service Records for ${vehicleName}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Exported on: ${exportDate}`, 14, 30);

        // Prepare table data
        const tableData = services.map(service => {
            const isDue = service.type === 'pending' ? (isServiceDue(service) ? 'Yes' : 'No') : 'N/A';
            return [
                service.type.charAt(0).toUpperCase() + service.type.slice(1), // Capitalize type
                service.description || 'N/A',
                service.type === 'pending' ? (service.dueDate || 'N/A') : (service.date || 'N/A'),
                service.type === 'pending' ? (service.dueMileage ? formatMileage(service.dueMileage) : 'N/A') : (service.mileage ? formatMileage(service.mileage) : 'N/A'),
                service.type === 'pending' ? (service.priority || 'N/A') : 'N/A',
                service.type === 'completed' ? (service.cost ? formatCurrency(service.cost) : 'N/A') : 'N/A',
                service.type === 'completed' ? (service.shop || 'N/A') : 'N/A',
                service.type === 'completed' ? (service.receipt || 'N/A') : 'N/A',
                service.type === 'pending' ? (service.notes || 'N/A') : 'N/A',
                isDue
            ];
        });

        // Define table headers
        const headers = [
            'Type', 'Description', 'Date', 'Mileage', 'Priority',
            'Cost', 'Shop', 'Receipt #', 'Notes', 'Is Due'
        ];

        // Add table using jspdf-autotable with color-coding
        doc.autoTable({
            head: [headers],
            body: tableData,
            startY: 40,
            styles: { fontSize: 8, cellPadding: 2, textColor: [28, 27, 31] }, // MD3 on-surface color (#1c1b1f)
            headStyles: { fillColor: [103, 80, 164] }, // MD3 primary color (#6750a4)
            margin: { top: 40 },
            columnStyles: {
                0: { cellWidth: 15 }, // Type
                1: { cellWidth: 25 }, // Description
                2: { cellWidth: 15 }, // Date
                3: { cellWidth: 15 }, // Mileage
                4: { cellWidth: 15 }, // Priority
                5: { cellWidth: 15 }, // Cost
                6: { cellWidth: 20 }, // Shop
                7: { cellWidth: 15 }, // Receipt #
                8: { cellWidth: 25 }, // Notes
                9: { cellWidth: 15 }  // Is Due
            },
            didParseCell: (data) => {
                if (data.row.section === 'body') {
                    const serviceType = data.row.raw[0]; // Type column (e.g., "Pending" or "Completed")
                    if (serviceType === 'Pending') {
                        Object.values(data.row.cells).forEach(cell => {
                            cell.styles.fillColor = [255, 236, 179]; // MD3 amber-100 (#FFECB3)
                        });
                    } else if (serviceType === 'Completed') {
                        Object.values(data.row.cells).forEach(cell => {
                            cell.styles.fillColor = [200, 230, 201]; // MD3 green-100 (#C8E6C9)
                        });
                    }
                }
            }
        });

        // Generate filename
        const sanitizedVehicleName = vehicleName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `CSART_Records_${sanitizedVehicleName}_${exportDate}.pdf`;

        // Download the PDF
        doc.save(filename);
        showSnackbar('Service records exported to PDF');
    } catch (e) {
        console.error('Error exporting service records to PDF:', e);
        showSnackbar('Failed to export service records');
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

// Function to open service modal
function openServiceModal(type = 'pending', index = -1) {
    try {
        const modal = document.getElementById('serviceModal');
        const formContainer = document.getElementById('serviceFormContainer');
        if (!modal || !formContainer) {
            console.error('Service modal elements not found');
            return;
        }

        const vehicle = getSelectedVehicle();
        if (!vehicle) {
            console.error('No vehicle selected');
            return;
        }

        const unitSystem = localStorage.getItem('unitSystem') || 'metric';
        const mileageUnit = getMileageUnit();
        let service = { description: '', dueDate: '', dueMileage: '', priority: 'Medium', notes: '', date: '', mileage: '', cost: '', shop: '', receipt: '' };

        if (index >= 0) {
            currentServiceType = type;
            currentServiceIndex = index;
            service = type === 'pending' ? vehicle.pendingServices[index] : vehicle.completedServices[index];
        } else {
            currentServiceType = type;
            currentServiceIndex = -1;
        }

        const convertedMileage = service.mileage || service.dueMileage
            ? convertMileage(service.mileage || service.dueMileage, 'metric', unitSystem)
            : '';

        formContainer.innerHTML = `
            <div class="radio-group">
                <label>
                    <input type="radio" name="serviceType" value="pending" ${type === 'pending' ? 'checked' : ''} onclick="openServiceModal('pending', ${index})">
                    Pending Service
                </label>
                <label>
                    <input type="radio" name="serviceType" value="completed" ${type === 'completed' ? 'checked' : ''} onclick="openServiceModal('completed', ${index})">
                    Completed Service
                </label>
            </div>
            <div class="form-group">
                <input type="text" id="serviceDescription" class="material-input" placeholder=" " value="${service.description || ''}" required>
                <label for="serviceDescription">Description</label>
            </div>
            ${type === 'pending' ? `
                <div class="form-group">
                    <input type="date" id="serviceDueDate" class="material-input" placeholder=" " value="${service.dueDate || ''}">
                    <label for="serviceDueDate">Due Date</label>
                </div>
                <div class="form-group">
                    <input type="number" id="serviceDueMileage" class="material-input" placeholder=" " value="${convertedMileage || ''}" min="0">
                    <label for="serviceDueMileage">Due Mileage (${mileageUnit})</label>
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
                    <textarea id="serviceNotes" class="material-input" placeholder=" " rows="3">${service.notes || ''}</textarea>
                    <label for="serviceNotes">Notes</label>
                </div>
            ` : `
                <div class="form-group">
                    <input type="date" id="serviceDate" class="material-input" placeholder=" " value="${service.date || ''}" required>
                    <label for="serviceDate">Date</label>
                </div>
                <div class="form-group">
                    <input type="number" id="serviceMileage" class="material-input" placeholder=" " value="${convertedMileage || ''}" min="0" required>
                    <label for="serviceMileage">Mileage (${mileageUnit})</label>
                </div>
                <div class="form-group">
                    <input type="number" id="serviceCost" class="material-input" placeholder=" " value="${service.cost || ''}" min="0" step="0.01">
                    <label for="serviceCost">Cost</label>
                </div>
                <div class="form-group">
                    <input type="text" id="serviceShop" class="material-input" placeholder=" " value="${service.shop || ''}">
                    <label for="serviceShop">Shop</label>
                </div>
                <div class="form-group">
                    <input type="text" id="serviceReceipt" class="material-input" placeholder=" " value="${service.receipt || ''}">
                    <label for="serviceReceipt">Receipt #</label>
                </div>
            `}
            <div class="form-buttons">
                <button class="material-button" onclick="submitService()">
                    ${index >= 0 ? 'Update Service' : 'Add Service'}
                </button>
                <button class="material-button cancel-btn" onclick="closeServiceModal()">Cancel</button>
            </div>
        `;

        modal.style.display = 'flex';
    } catch (e) {
        console.error('Error in openServiceModal:', e);
    }
}

// Function to submit service (add or update)
function submitService() {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) {
            showSnackbar('No vehicle selected');
            return;
        }

        const description = document.getElementById('serviceDescription')?.value;
        const unitSystem = localStorage.getItem('unitSystem') || 'metric';

        if (!description) {
            showSnackbar('Please fill in the description');
            return;
        }

        const service = {};
        if (currentServiceType === 'pending') {
            const dueDate = document.getElementById('serviceDueDate')?.value;
            const dueMileage = parseFloat(document.getElementById('serviceDueMileage')?.value) || 0;
            const priority = document.getElementById('servicePriority')?.value;
            const notes = document.getElementById('serviceNotes')?.value;

            service.description = description;
            service.dueDate = dueDate;
            service.dueMileage = dueMileage ? convertMileage(dueMileage, unitSystem, 'metric') : 0;
            service.priority = priority;
            service.notes = notes;

            if (currentServiceIndex >= 0) {
                vehicle.pendingServices[currentServiceIndex] = service;
            } else {
                vehicle.pendingServices.push(service);
            }
        } else {
            const date = document.getElementById('serviceDate')?.value;
            const mileage = parseFloat(document.getElementById('serviceMileage')?.value) || 0;
            const cost = parseFloat(document.getElementById('serviceCost')?.value) || 0;
            const shop = document.getElementById('serviceShop')?.value;
            const receipt = document.getElementById('serviceReceipt')?.value;

            if (!date || !mileage) {
                showSnackbar('Please fill in date and mileage for completed service');
                return;
            }

            service.description = description;
            service.date = date;
            service.mileage = mileage ? convertMileage(mileage, unitSystem, 'metric') : 0;
            service.cost = cost;
            service.shop = shop;
            service.receipt = receipt;

            if (currentServiceIndex >= 0) {
                vehicle.completedServices[currentServiceIndex] = service;
            } else {
                vehicle.completedServices.push(service);
            }
        }

        saveData();
        renderServicesList();
        showSnackbar(currentServiceIndex >= 0 ? 'Service updated' : 'Service added');
        closeServiceModal();
    } catch (e) {
        console.error('Error in submitService:', e);
        showSnackbar('Failed to save service');
    }
}

// Function to close service modal
function closeServiceModal() {
    try {
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.style.display = 'none';
            currentServiceType = null;
            currentServiceIndex = -1;
        }
    } catch (e) {
        console.error('Error in closeServiceModal:', e);
    }
}

// Function to edit a service from modal
function editServiceFromModal() {
    try {
        if (currentServiceType !== null && currentServiceIndex !== -1) {
            openServiceModal(currentServiceType, currentServiceIndex);
            closeServiceDetailModal();
        }
    } catch (e) {
        console.error('Error in editServiceFromModal:', e);
    }
}

// Function to delete a service from modal
function deleteServiceFromModal() {
    try {
        if (currentServiceType !== null && currentServiceIndex !== -1) {
            const vehicle = getSelectedVehicle();
            if (!vehicle) return;

            if (confirm('Are you sure you want to delete this service?')) {
                if (currentServiceType === 'completed') {
                    vehicle.completedServices.splice(currentServiceIndex, 1);
                    showSnackbar('Completed service deleted');
                } else {
                    vehicle.pendingServices.splice(currentServiceIndex, 1);
                    showSnackbar('Pending service deleted');
                }
                saveData();
                renderServicesList();
                closeServiceDetailModal();
            }
        }
    } catch (e) {
        console.error('Error in deleteServiceFromModal:', e);
    }
}

// Function to open service detail modal
function openServiceDetailModal(type, index) {
    try {
        const vehicle = getSelectedVehicle();
        if (!vehicle) return;

        const modal = document.getElementById('serviceDetailModal');
        const list = document.getElementById('serviceDetailList');
        const editButton = document.getElementById('serviceDetailEdit');
        const deleteButton = document.getElementById('serviceDetailDelete');
        if (!modal || !list || !editButton || !deleteButton) {
            console.error('Service detail modal elements not found');
            return;
        }

        // Store the current service type and index for edit/delete actions
        currentServiceType = type;
        currentServiceIndex = index;

        list.innerHTML = '';
        let service;
        if (type === 'completed') {
            service = vehicle.completedServices[index];
            list.innerHTML = `
                <li><strong>Type:</strong> Completed</li>
                <li><strong>Description:</strong> ${service.description || '-'}</li>
                <li><strong>Date:</strong> ${service.date || '-'}</li>
                <li><strong>Mileage:</strong> ${service.mileage ? formatMileage(service.mileage) : '-'}</li>
                <li><strong>Cost:</strong> ${service.cost ? formatCurrency(service.cost) : '-'}</li>
                <li><strong>Shop:</strong> ${service.shop || '-'}</li>
                <li><strong>Receipt #:</strong> ${service.receipt || '-'}</li>
            `;
        } else {
            service = vehicle.pendingServices[index];
            list.innerHTML = `
                <li><strong>Type:</strong> Pending</li>
                <li><strong>Description:</strong> ${service.description || '-'}</li>
                <li><strong>Due Date:</strong> ${service.dueDate || '-'}</li>
                <li><strong>Due Mileage:</strong> ${service.dueMileage ? formatMileage(service.dueMileage) : '-'}</li>
                <li><strong>Priority:</strong> ${service.priority || '-'}</li>
                <li><strong>Notes:</strong> ${service.notes || '-'}</li>
                <li><strong>Is Due:</strong> ${isServiceDue(service) ? 'Yes' : 'No'}</li>
            `;
        }

        editButton.style.display = 'inline-flex';
        deleteButton.style.display = 'inline-flex';
        modal.style.display = 'flex';
    } catch (e) {
        console.error('Error in openServiceDetailModal:', e);
    }
}

// Function to close service detail modal
function closeServiceDetailModal() {
    try {
        const modal = document.getElementById('serviceDetailModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('serviceDetailList').innerHTML = '';
            document.getElementById('serviceDetailEdit').style.display = 'none';
            document.getElementById('serviceDetailDelete').style.display = 'none';
            currentServiceType = null;
            currentServiceIndex = -1;
        }
    } catch (e) {
        console.error('Error in closeServiceDetailModal:', e);
    }
}

// Function to toggle search field visibility
function toggleSearch() {
    try {
        const searchField = document.querySelector('.search-field');
        const detailPage = document.getElementById('detailPage');
        if (searchField.style.display === 'none' || searchField.style.display === '') {
            searchField.style.display = 'flex';
            detailPage.classList.add('search-active');
            document.getElementById('servicesSearch').focus();
        } else {
            clearSearch();
        }
    } catch (e) {
        console.error('Error in toggleSearch:', e);
    }
}

// Function to clear search and hide search field
function clearSearch() {
    try {
        const searchField = document.querySelector('.search-field');
        const searchInput = document.getElementById('servicesSearch');
        const detailPage = document.getElementById('detailPage');
        searchInput.value = '';
        searchField.style.display = 'none';
        detailPage.classList.remove('search-active');
        renderServicesList();
    } catch (e) {
        console.error('Error in clearSearch:', e);
    }
}

// Function to filter services based on search query
function filterServices(services, query) {
    if (!query) return services;
    query = query.toLowerCase();
    return services.filter(service => 
        service.description.toLowerCase().includes(query)
    );
}

// Function to render services list
function renderServicesList() {
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

        // Filter services based on search queryCached
        const searchInput = document.getElementById('servicesSearch');
        const query = searchInput ? searchInput.value : '';
        const filteredServices = filterServices(services, query);

        const servicesBody = document.getElementById('detailServicesBody');
        servicesBody.innerHTML = '';
        filteredServices.forEach(service => {
            const isDue = service.type === 'pending' && isServiceDue(service);
            const priorityClass = service.type === 'pending' ? 
                (service.priority === 'High' ? 'priority-high' : 
                 service.priority === 'Medium' ? 'priority-medium' : 'priority-low') : '';
            const iconClass = service.type === 'pending' ? 
                `pending ${service.priority.toLowerCase()}` : 'completed';

            const item = document.createElement('div');
            item.className = 'service-item';
            if (isDue && !priorityClass) item.classList.add('due');
            if (priorityClass) item.classList.add(priorityClass);
            item.setAttribute('aria-label', `View details for ${service.description}`);

            // Dataset attributes for potential future use
            item.dataset.type = service.type;
            item.dataset.date = service.type === 'pending' ? (service.dueDate || '') : (service.date || '');
            item.dataset.mileage = service.type === 'pending' ? (service.dueMileage ? formatMileage(service.dueMileage) : '') : (service.mileage ? formatMileage(service.mileage) : '');
            item.dataset.priority = service.type === 'pending' ? (service.priority || '') : '';
            item.dataset.cost = service.type === 'completed' ? (service.cost ? formatCurrency(service.cost) : '') : '';
            item.dataset.shop = service.type === 'completed' ? (service.shop || '') : '';
            item.dataset.receipt = service.type === 'completed' ? (service.receipt || '') : '';
            item.dataset.notes = service.type === 'pending' ? (service.notes || '') : '';
            item.dataset.isDue = service.type === 'pending' ? (isDue ? 'Yes' : 'No') : '';

            let detailsText = '';
            let timestampText = '';
            if (service.type === 'pending') {
                detailsText = `${service.dueMileage ? `Due Mileage: ${formatMileage(service.dueMileage)}` : ''}${service.notes ? ` - ${service.notes}` : ''}`;
                timestampText = service.dueDate || '';
            } else {
                detailsText = `${service.mileage ? `Mileage: ${formatMileage(service.mileage)}` : ''}${service.cost ? ` - Cost: ${formatCurrency(service.cost)}` : ''}`;
                timestampText = service.date || '';
            }

            item.innerHTML = `
                <span class="material-icons service-icon ${iconClass}">
                    ${service.type === 'pending' ? 'schedule' : 'check_circle'}
                </span>
                <div class="service-content">
                    <div class="service-description">${service.description}</div>
                    <div class="service-meta">
                        <span class="service-details">${detailsText}</span>
                    </div>
                </div>
                <div class="service-timestamp">${timestampText}</div>
            `;
            item.addEventListener('click', () => openServiceDetailModal(service.type, service.index));
            servicesBody.appendChild(item);
        });
    } catch (e) {
        console.error('Error in renderServicesList:', e);
    }
}

// Add event listener for search input
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('servicesSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderServicesList();
        });
    }
});