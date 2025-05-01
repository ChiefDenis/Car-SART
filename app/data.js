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