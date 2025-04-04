export function loadStoredData() {
	// Maximum change: load data from localStorage with error handling
	try {
		const data = JSON.parse(localStorage.getItem('scanResults')) || {};
		console.log("Loaded stored data:", data);
		return data;
	} catch (error) {
		console.error("Error loading stored data:", error);
		return {};
	}
}
