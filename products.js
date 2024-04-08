const axios = require('axios');
const mysql = require('mysql2');

const bigCommerceConfig = {
  clientId: '8w76cwvip72ng2gx8b4k4zc4zar26i9',
  clientSecret: 'c18895a36cf795133819b35bc75334297b9e1c3829395826872e580311e392ea',
  accessToken: '4e6zfabiyr2utsjqhz793guyjdlyhd5',
  storeHash: '2k6k8dfrvs',
};

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

dbConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + dbConnection.threadId);

  // Function to fetch products recursively
  const fetchProducts = (page = 1) => {
    axios.get(`https://api.bigcommerce.com/stores/${bigCommerceConfig.storeHash}/v3/catalog/products`, {
      headers: {
        'X-Auth-Client': bigCommerceConfig.clientId,
        'X-Auth-Token': bigCommerceConfig.accessToken,
        'Content-Type': 'application/json',
      },
      params: {
        page: page,
      },
    })
      .then((response) => {
        const products = response.data.data;

        // Insert products into MySQL
        products.forEach(product => {
          const productData = {
            wc_id: product.id,
            name: product.name,
            price: product.price,
            // Add other relevant fields as needed
          };

          // Insert product into MySQL
          dbConnection.query('INSERT INTO products SET ?', productData, (dbError, rows) => {
            if (dbError) {
              console.error('Error inserting product into MySQL:', dbError);
            } else {
              console.log('Product inserted into MySQL with ID:', rows.insertId);
            }
          });
        });

        // If there are more pages, fetch the next page
        if (response.data.meta.pagination.total_pages > page) {
          fetchProducts(page + 1);
        } else {
          // All products fetched, close the MySQL connection
          dbConnection.end((endError) => {
            if (endError) {
              console.error('Error closing MySQL connection:', endError.stack);
            } else {
              console.log('MySQL connection closed.');
            }
          });
        }
      })
      .catch((error) => {
        console.error('Error fetching products from BigCommerce:', error);
      });
  };

  // Start fetching products
  fetchProducts();
});
