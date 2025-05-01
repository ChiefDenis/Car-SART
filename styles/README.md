Car SART - Car Service Tracker
Overview
Car Service Tracker is a web application designed to help users manage vehicle maintenance by tracking services and repairs. Users can add vehicles, record pending and completed services, and monitor current vehicle information such as mileage and date. The app features a clean, mobile-friendly interface inspired by Material Design, with support for light and dark modes.
Features

Vehicle Management: Add, edit, and delete vehicles with names and notes.
Service Tracking: Record pending and completed services with details like description, date, mileage, priority, cost, shop, and receipt number.
Current Information: Track the current date and mileage for each vehicle, with automatic date syncing via a time server.
Export to CSV: Export service records to a CSV file for easy backup or analysis.
Dark Mode: Toggle between light and dark themes for better visibility.
Responsive Design: Optimized for both desktop and mobile devices.

Setup Instructions

Clone or Download the Repository:
Clone the repository or download the project files to your local machine.

git clone <repository-url>


Open the App:
Navigate to the project directory and open index.html in a web browser. No server is required as the app runs entirely on the client side.
Example: Open index.html in Chrome, Firefox, or any modern browser.


Dependencies:
The app uses external resources loaded via CDN:
Google Fonts (Roboto) for typography.
Material Icons for icons.


Ensure you have an internet connection to load these resources.


Local Storage:
The app uses localStorage to persist data. Data will be saved automatically as you add or modify vehicles and services.



Usage

Main Page:
View a list of vehicles.
Click the floating action button (FAB) to add a new vehicle.
Click a vehicle to view its details.


Detail Page:
View vehicle details, current information (date and mileage), and a list of services.
Add a new service using the FAB.
Click a service to view its details in a modal, where you can edit or delete it.
Export services to a CSV file using the "Export to CSV" button at the bottom of the services list.


Modals:
Use modals to add/edit vehicles, services, and current information.
Service modals support both pending and completed services with different fields.


Hamburger Menu:
Access additional features like backup/restore data and toggle dark mode via the hamburger menu in the top bar.



File Structure
car-service-tracker/
├── index.html          # Main HTML file
├── styles/             # CSS files
│   ├── global.css      # Global styles and variables
│   ├── top-bar.css     # Styles for the top bar and hamburger menu
│   ├── vehicle-list.css # Styles for the vehicle list
│   ├── services.css    # Styles for the services list
│   ├── info-strip.css  # Styles for the current info strip
│   ├── modal.css       # Styles for modals
│   └── snackbar.css    # Styles for the snackbar
└── app/                # JavaScript files
    ├── core.js         # Core utilities (e.g., navigation, dark mode)
    ├── data.js         # Data management (e.g., vehicles array, save/restore)
    ├── vehicle-list.js # Functions for rendering vehicle list
    ├── services.js     # Functions for rendering and managing services
    ├── current-info.js # Functions for managing current vehicle info
    └── modals.js       # Functions for handling modals

Design Notes

Styling: The app uses Material Design principles with a Gmail-inspired list view for services. Icons indicate service status (clock for pending, checkmark for completed).
Colors:
Pending services are color-coded by priority: red (high), amber (medium), blue (low).
Completed services use green for their icons.
Edit buttons are yellow, delete buttons are red, and primary actions use blue.


Accessibility: List items include aria-label attributes for screen reader support.

Limitations

No Backend: Data is stored in localStorage, so it’s tied to the browser. Use the backup/restore feature to transfer data between devices.
Network Dependency: The app fetches the current date from worldtimeapi.org to sync vehicle information. If offline, it falls back to the device’s date.
Browser Compatibility: Tested on modern browsers (Chrome, Firefox, Safari). May not work fully on older browsers like IE.

Future Improvements

Add offline support with a local time fallback.
Implement search/filter functionality for services.
Add support for attaching receipts as images.
Enhance accessibility with more ARIA attributes and keyboard navigation.

Contributing
Feel free to fork the repository, make changes, and submit pull requests. For major changes, please open an issue to discuss your ideas first.
License
This project is licensed under the MIT License. See the LICENSE file for details.
