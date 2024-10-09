import fetch from 'node-fetch'; // Use import if you have configured it for ES modules

const url = 'AIzaSyDXLalygS0hAPn55rWh89yeoeiQV8B5DcU'; // Replace with your actual API URL

async function fetchHotelInfo() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Full API Response:', data); // Log the full response

    if (data.error_message) {
      throw new Error(`API Error: ${data.error_message}`);
    }

    // Assuming the response structure has 'result'
    console.log('Hotel Information:');
    console.log('Name:', data.result ? data.result.name : 'Not available');
    console.log('Address:', data.result ? data.result.formatted_address : 'Not available');
    console.log('Rating:', data.result ? data.result.rating : 'Not available');
    console.log('Phone:', data.result ? data.result.formatted_phone_number : 'Not available');
    console.log('Website:', data.result ? data.result.website : 'Not available');
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchHotelInfo();
