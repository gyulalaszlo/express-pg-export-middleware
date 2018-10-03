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

@returns {express.Middleware}  A new express middleware that will
