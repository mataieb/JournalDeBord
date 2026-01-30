
// Native fetch used

// Function to fetch log for a specific date
async function fetchLog(date) {
    try {
        const response = await fetch(`http://localhost:3001/api/log/${date}`);
        const data = await response.json();
        console.log(`Data for ${date}:`, JSON.stringify(data.gutHealth, null, 2));
    } catch (error) {
        console.error('Error fetching log:', error);
    }
}

// Check today (might have data)
const today = new Date().toISOString().split('T')[0];
console.log('--- Checking Today ---');
fetchLog(today);

// Check a future date (should contain null gutHealth)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dateStr = tomorrow.toISOString().split('T')[0];
console.log(`--- Checking Tomorrow (${dateStr}) ---`);
fetchLog(dateStr);
