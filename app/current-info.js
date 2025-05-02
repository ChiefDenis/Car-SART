// Function to sync date with time server (now using local device time)
function setCurrentDate(vehicle) {
    // Always use the device time if the date is unset or significantly outdated
    const deviceDate = new Date().toISOString().split('T')[0];
    if (!vehicle.currentInfo.date || Math.abs(new Date(vehicle.currentInfo.date) - new Date(deviceDate)) > 24 * 60 * 60 * 1000) {
        vehicle.currentInfo.date = deviceDate;
        saveData();
        console.log('Set date to device time:', vehicle.currentInfo.date);
    }
}

// Function to render selected vehicle’s data
async function renderSelectedVehicle() {
    try {
        const vehicle = getSelectedVehicle();
        if (vehicle) {
            // Set the current date using device time
            setCurrentDate(vehicle);

            document.getElementById('detailVehicleName').textContent = vehicle.name;
            document.getElementById('detailVehicleNotes').textContent = vehicle.notes || '';
            document.getElementById('currentDateDisplay').textContent = vehicle.currentInfo.date;
            document.getElementById('currentMileageDisplay').textContent = formatMileage(vehicle.currentInfo.mileage);
            renderServicesList();
        } else {
            console.error('No vehicle found for ID:', selectedVehicleId);
            showSnackbar('Vehicle not found');
            navigateTo('/');
        }
    } catch (e) {
        console.error('Error in renderSelectedVehicle:', e);
    }
}

function renderCurrentInfo(vehicle) {
    try {
        const currentDateDisplay = document.getElementById('currentDateDisplay');
        const currentMileageDisplay = document.getElementById('currentMileageDisplay');
        if (!currentDateDisplay || !currentMileageDisplay) {
            console.error('Current info elements not found');
            return;
        }
        currentDateDisplay.textContent = vehicle.currentDate || 'Not set';
        currentMileageDisplay.textContent = vehicle.currentMileage ? formatMileage(vehicle.currentMileage) : 'Not set';
    } catch (e) {
        console.error('Error in renderCurrentInfo:', e);
    }
}

// Current Info Modal functions
function openCurrentInfoModal() {
    try {
        const modal = document.getElementById('currentInfoModal');
        const vehicle = getSelectedVehicle();
        if (!modal || !vehicle) {
            console.error('Current info modal or vehicle not found');
            return;
        }

        document.getElementById('modalCurrentDate').value = vehicle.currentInfo.date;
        const unitSystem = localStorage.getItem('unitSystem') || 'metric';
        const convertedMileage = vehicle.currentInfo.mileage
            ? convertMileage(vehicle.currentInfo.mileage, 'metric', unitSystem)
            : '';
        document.getElementById('modalCurrentMileage').value = convertedMileage || '';
        document.getElementById('modalCurrentMileage').placeholder = getMileageUnit();
        modal.style.display = 'flex';
    } catch (e) {
        console.error('Error in openCurrentInfoModal:', e);
    }
}

function closeCurrentInfoModal() {
    try {
        const modal = document.getElementById('currentInfoModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('modalCurrentDate').value = '';
            document.getElementById('modalCurrentMileage').value = '';
        }
    } catch (e) {
        console.error('Error in closeCurrentInfoModal:', e);
    }
}

function submitCurrentInfo() {
    try {
        const vehicle = getSelectedVehicle();
        if (vehicle) {
            const date = document.getElementById('modalCurrentDate').value;
            const mileageInput = document.getElementById('modalCurrentMileage').value;
            if (!date) {
                alert('Please enter a valid date.');
                return;
            }
            const unitSystem = localStorage.getItem('unitSystem') || 'metric';
            const mileageValue = parseFloat(mileageInput) || 0;
            vehicle.currentInfo.date = date;
            vehicle.currentInfo.mileage = convertMileage(mileageValue, unitSystem, 'metric');
            saveData();
            renderSelectedVehicle();
            showSnackbar('Current information updated');
            closeCurrentInfoModal();
        }
    } catch (e) {
        console.error('Error in submitCurrentInfo:', e);
    }
}