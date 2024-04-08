const axios = require('axios');
const mysql = require('mysql2');

// BigCommerce configuration
const bigCommerceConfig = {
  clientId: '8w76cwvip72ng2gx8b4k4zc4zar26i9',
  clientSecret: 'c18895a36cf795133819b35bc75334297b9e1c3829395826872e580311e392ea',
  accessToken: '4e6zfabiyr2utsjqhz793guyjdlyhd5',
  storeHash: '2k6k8dfrvs',
};

// MySQL configuration
const dbConnection = mysql.createConnection({
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

// Function to fetch products with detailed error handling
const fetchProducts = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight

    // Delete products added on previous dates
    await dbConnection.promise().query('DELETE FROM newproducts WHERE DATE(date_added) < CURDATE()');

    // Fetch new products from BigCommerce
    const response = await axios.get(`https://api.bigcommerce.com/stores/${bigCommerceConfig.storeHash}/v3/catalog/products`, {
      headers: {
        'X-Auth-Client': bigCommerceConfig.clientId,
        'X-Auth-Token': bigCommerceConfig.accessToken,
        'Content-Type': 'application/json',
      },
    });

    const products = response.data.data;

    // Insert new products into MySQL
    for (const product of products) {
      const productData = {
        wc_id: product.id,
        name: product.name,
        price: product.price,
        date_added: today,
        // Add other relevant fields as needed
      };

      await dbConnection.promise().query('INSERT INTO newproducts SET ?', productData);
    }

    console.log('Products updated successfully.');

  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    // Close the MySQL connection
    dbConnection.end((endError) => {
      if (endError) {
        console.error('Error closing MySQL connection:', endError.stack);
      } else {
        console.log('MySQL connection closed.');
      }
    });
  }
};

// Execute the daily update
fetchProducts();
