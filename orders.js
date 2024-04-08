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

async function fetchAndInsertOrders() {
  try {
    const response = await axios.get(
      `https://api.bigcommerce.com/stores/${bigCommerceConfig.storeHash}/v2/orders`,
      {
        headers: {
          'X-Auth-Client': bigCommerceConfig.clientId,
          'X-Auth-Token': bigCommerceConfig.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const ordersData = response.data;

    console.log('Orders Data:', ordersData);

    if (Array.isArray(ordersData) && ordersData.length > 0) {
      ordersData.forEach(order => {
        const orderInfo = {
          order_id: order.id,
          customer_id: order.customer_id,
          total: order.total_inc_tax,
          created_at: new Date(order.date_created).toISOString().slice(0, 19).replace('T', ' '), // Format date
          updated_at: new Date(order.date_modified).toISOString().slice(0, 19).replace('T', ' '), // Format date
        };

        const insertQuery = 'INSERT INTO orders SET ?';

        dbcon.query(insertQuery, orderInfo, (error, results) => {
          if (error) {
            console.error('Error inserting order into MySQL:', error);
          } else {
            console.log('Order added to database with ID:', results.insertId);
          }
        });
      });
    } else {
      console.error('No order data to insert or order data is not an array:', ordersData);
    }
  } catch (error) {
    console.error('Error fetching or inserting orders:', error);
  } finally {
    // Do not close the MySQL connection here
  }
}

// Call the function to fetch and insert orders
fetchAndInsertOrders();
