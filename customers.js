const axios = require('axios');
const mysql = require('mysql2');

const bigCommerceConfig = {
  clientId: '8w76cwvip72ng2gx8b4k4zc4zar26i9',
  clientSecret: 'c18895a36cf795133819b35bc75334297b9e1c3829395826872e580311e392ea',
  accessToken: '4e6zfabiyr2utsjqhz793guyjdlyhd5',
  storeHash: '2k6k8dfrvs',
};

const dbcon = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '.bumrah007',
  database: 'bigcommerce',
  authSwitchHandler: function ({ pluginName, pluginData }, cb) {
    if (pluginName === 'caching_sha2_password') {
      // Use mysql_native_password for authentication
      return cb(null, Buffer.from('mysql_native_password'));
    }
    cb(new Error(`Unsupported auth plugin: ${pluginName}`));
  },
});

dbcon.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    return;
  }
  console.log('Connected to MySQL');
});

async function fetchAndInsertCustomers() {
  try {
    const response = await axios.get(
      `https://api.bigcommerce.com/stores/${bigCommerceConfig.storeHash}/v3/customers`,
      {
        headers: {
          'X-Auth-Client': bigCommerceConfig.clientId,
          'X-Auth-Token': bigCommerceConfig.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const customerData = response.data.data; // Update to access the 'data' array

    console.log('Fetched customers from BigCommerce:', customerData);

    if (Array.isArray(customerData) && customerData.length > 0) {
      customerData.forEach(customer => {
        const customerInfo = {
          bc_id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          // Add other relevant fields as needed
        };

        const insertQuery = 'INSERT INTO customers SET ?';

        dbcon.query(insertQuery, customerInfo, (error, results) => {
          if (error) {
            console.error('Error inserting customer into MySQL:', error);
          } else {
            console.log('Customer added to database with ID:', results.insertId);
          }
        });
      });
    } else {
      console.error('No customer data to insert or customer data is not an array:', customerData);
    }

  } catch (error) {
    console.error('Error fetching or inserting customers:', error);
  } finally {
    // Do not close the MySQL connection here
  }
}

// Call the function to fetch and insert customers
fetchAndInsertCustomers();
