let express = require('express');

let app = express()
let port = 3000;

let pg = require('pg');

let client = new pg.Client();
client.connect()

let pgResultCSV = require('./index');


/**
 * Returns a middleware function that returns the results of
 * a query as either 'csv' or 'json'
 */






app.use('/test', pgResultCSV({
  client,
  query:"select * from lobj_write_test",
  format: "csv"
}))


app.use('/test2', pgResultCSV({
  client,
  query:"select * from information_schema.columns",
  // output it as an HTML table
  format: "html",
  // Specify a default limit and offset to keep things in check
  // users can later change the limit and offset by using query parameters
  limit: 100,
  offset: 10,
  order: "table_name ASC, column_name DESC",
}))


// Example of how to filter
app.use('/test3', pgResultCSV({
  client,
  query:"select * from information_schema.columns where column_name = $1",
  args: req => [ req.query.column_name ],
  format: "html"
}))





app.listen(port, () => console.log(`Example app listening on port ${port}!`))
