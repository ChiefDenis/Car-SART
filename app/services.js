let currentServiceType = null;
let currentServiceIndex = -1;

// Function to export list to CSV
function exportToCSV(listId, filename) {
    try {
        const container = document.getElementById(listId);
        const items = Array.from(container.querySelectorAll('.service-item'));
        const headers = [
            'Type', 'Description', 'Date', 'Mileage', 'Priority', 
            'Cost', 'Shop', 'Receipt #', 'Notes', 'Is Due'
        ];
        const csvRows = [headers.join(',')];
        
        items.forEach(item => {
            const type = item.dataset.type || '';
            const description = item.querySelector('.service-description')?.textContent || '';
            const date = item.dataset.date || '';
            const mileage = item.dataset.mileage || '';
            const priority = item.dataset.priority || '';
            const cost = item.dataset.cost ? item.dataset.cost.replace('₦', '') : '';
            const shop = item.dataset.shop || '';
            const receipt = item.dataset.receipt || '';
            const notes = item.dataset.notes || '';
            const isDue = item.dataset.isDue || '';

            const row = [
                `"${type}"`, `"${description}"`, `"${date}"`, `"${mileage}"`, `"${priority}"`,
                `"${cost}"`, `"${shop}"`, `"${receipt}"`, `"${notes}"`, `"${isDue}"`
            ];
            csvRows.push(row.join(','));
        });

        const csv = csvRows.join('\n');
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
                <li><strong>Mileage:</strong> ${service.mileage || '-'}</li>
                <li><strong>Cost:</strong> ₦${(service.cost || 0).toFixed(2)}</li>
                <li><strong>Shop:</strong> ${service.shop || '-'}</li>
                <li><strong>Receipt #:</strong> ${service.receipt || '-'}</li>
            `;
        } else {
            service = vehicle.pendingServices[index];
            list.innerHTML = `
                <li><strong>Type:</strong> Pending</li>
                <li><strong>Description:</strong> ${service.description || '-'}</li>
                <li><strong>Due Date:</strong> ${service.dueDate || '-'}</li>
                <li><strong>Due Mileage:</strong> ${service.dueMileage || '-'}</li>
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

        // Filter services based on search query
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

            // Dataset attributes for CSV export
            item.dataset.type = service.type;
            item.dataset.date = service.type === 'pending' ? (service.dueDate || '') : (service.date || '');
            item.dataset.mileage = service.type === 'pending' ? (service.dueMileage || '') : (service.mileage || '');
            item.dataset.priority = service.type === 'pending' ? (service.priority || '') : '';
            item.dataset.cost = service.type === 'completed' ? `₦${(service.cost || 0).toFixed(2)}` : '';
            item.dataset.shop = service.type === 'completed' ? (service.shop || '') : '';
            item.dataset.receipt = service.type === 'completed' ? (service.receipt || '') : '';
            item.dataset.notes = service.type === 'pending' ? (service.notes || '') : '';
            item.dataset.isDue = service.type === 'pending' ? (isDue ? 'Yes' : 'No') : '';

            let detailsText = '';
            let timestampText = '';
            if (service.type === 'pending') {
                detailsText = `${service.dueMileage ? `Due Mileage: ${service.dueMileage}` : ''}${service.notes ? ` - ${service.notes}` : ''}`;
                timestampText = service.dueDate || '';
            } else {
                detailsText = `${service.mileage ? `Mileage: ${service.mileage}` : ''}${service.cost ? ` - Cost: ₦${service.cost.toFixed(2)}` : ''}`;
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