# express-pg-export-middleware

Express.js middleware to return the results of a PG query as CSV, JSON or HTML table.


### Usage


```js

// import PG & create a client
let pg = require('pg');
let client = new pg.Client();
client.connect()

// import our library
let pgResultCSV = require('express-pg-export-middleware');

app.use('/test', pgResultCSV({
  client,
  query:"select * from information_schema.columns",
  format: "html"
  }))



// Return the results of a select with some arguments
const MY_COLUMN_NAME = 'id';

app.use('/test-params', pgResultCSV({
  client,
  query:"select * from information_schema.columns where column_name = $1",
  // these args are forwarded to client.query(<Q>, <ARGS>)
  args: [MY_COLUMN_NAME],
  format: "csv"
  }))


// Some more examples about limit and offset and order
app.use('/test-limit-offset-order', pgResultCSV({
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



// Return the results of a select where arguments come
// from the query parameters
app.use('/test-request-params', pgResultCSV({
  client,
  query:"select * from information_schema.columns where table_name = $1 and column_name = $2",
  args: req => [req.query.table_name, req.query.column_name],
  format: "html"
  }))
```


#### Parameters:

- *client (pg.Client)*
  The Postgres client to use (or any other object with a 'query()' function and
  a 'rows' array in the return.

- *query (string)*
  The query string to select.

- *args (Array|(express.Request):Array)*
  The query arguments to pass to the query function. If this is a function, it
  will be called with the current request, and the return will be used as
  queryArgs.

- *format ('csv'|'json'|'json-pretty')*
  The output format to use.

- *limit*
  The maximum number of returned records (will add a "LIMIT" cause to the SQL)

- *offset*
  The start of the returned records (will add an "OFFSET" cause to the SQL)

- *order*
  An order-by pair. Example: `'created_at DESC'`

@returns {express.Middleware}  A new express middleware that will


### Front-end usage

The number and order of the returned data can be customized by the caller of the endpoint by using the following query parameters:

- `limit`
- `offset`
- `order`


These query parameters correspond to the call parameters of the same name.
