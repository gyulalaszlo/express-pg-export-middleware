let Papa = require('papaparse');

const ALLOWED_FORMATS = [ 'csv', 'html', 'json', 'json-pretty'];

// Formats a result
function formatResult(format, data) {
  switch(format) {
    case 'csv': return { contentType: 'text/csv', data: Papa.unparse(data)};
    case 'html':
      return { contentType: 'text/html', data: formatHTML(data) };
    case 'json':
      return { contentType: 'application/json', data: JSON.stringify(data) };
    case 'json-pretty':
      return { contentType: 'application/json', data: JSON.stringify(data, null, '\t') };
    default:
      throw new Error("Unknown format for result data: " + format);
  }
}


const CSS = `

body { font: 14px/18px "Helvetica Neue", "Verdana", "Arial", sans-serif; color: #555; }

table.data { min-width: 100%; }
table.data th { border-bottom: 0.2em solid; color: #aaa; font-size:0.8em; }
table.data td { padding: 0.1em 0.2em; }

table.data .value-number { color: #095; font-weight:bold; }
table.data .value-string { color: #950; font-weight:bold; }
table.data .value-undefined,
table.data .value-object { color: #aaa; }

table.data tr:hover td { background: #ddd; }

table.data tr:nth-child(even) {background: #ccc; }
table.data tr:nth-child(odd) {background: #fff; }


.btn { padding: 0.3em 1em; background: #095; color: #555; font-weight: bold; border-radius: 0.5em; text-decoration: none; margin: 0.2em; display: inline-block; }
.btn:hover { background: #095; color: white; }

.btn-alt-format { text-transform: uppercase; }
`;


function HTML(contents) {
  let otherFormats = ALLOWED_FORMATS
    .filter(f => f !== 'html') // do not show the HTML format
    .map(f => `<a title="View as ${f}" href="?format=${f}" class='btn btn-alt-format' target="_blank">${f}</a>`)
    .join('');

  return `<html>
  <head>
    <title>Query results</title>
    <style>${CSS}</style>
  </head>
  <body>
    <div class="other-formats">
      <b>Or view as:</b>
      ${otherFormats}
    </div>
    <div class='wrapper'>${contents}</div>
  </body>
  </html>
`;
}

function formatHTML(data) {

  function td(v) {
    let valueType = typeof v;
    let valueString = (typeof v === 'undefined' || v === null) ? 'NULL' : v.toString();
    return "<td class='value-" + valueType + "'>" + valueString + "</td>";
  }

  function th(v) {
    return "<th>" + v.toString() + "</th>";
  }

  function tr(cells) {
    return "<tr>" + cells.join('') + "</tr>";
  }

  function tbody(rows) {
    return "<tbody>" + rows.join('') + "</tbody>";
  }

  function thead(cells) {
    return "<thead>" + tr(cells) + "</thead>";
  }

  function table(parts) {
    return "<table class='data'>" + parts.join('') +  "</tbody>";
  }


  if (!data.length) {
    return "No data";
  }

  let keys = Object.keys(data[0]);
  let rows = data.slice(1)
    // transcode to array-of-arrays
    .map(row => keys.map(k => td(row[k])))
    .map(tr);



  let header = thead(keys.map(th));
  let body = tbody(rows);

  return HTML(table([header, body]));


}


/**
 * Returns a middleware function that returns the results of
 * a query as either 'csv' or 'json'.
 *
 * @param client {pg.Client} The Postgres client to use (or any other object
 *                           with a 'query()' function and a 'rows' array in
 *                           the return.
 *
 * @param query {string}     The query string to select.
 *
 * @param args  {Array|(express.Request):Array}   The query arguments to pass
 *                                                to the query function. If
 *                                                this is a function, it will
 *                                                be called with the current
 *                                                request, and the return
 *                                                will be used as queryArgs.
 *
 * @param format {'csv'|'json'|'json-pretty'}     The output format to use.
 *
 * @returns {express.Middleware}  A new express middleware that will
 */
function pgResultCSV({client, query, args=[], format="csv"}) {
  if (!client || typeof client.query !== 'function') {
    throw new Error("Expected a client with a 'query' function");
  }

  if (!query || typeof query !== 'string') {
    throw new Error("Query is not a string.");
  }

  let queryArgs = args;
  // Create a function from the query args
  if (typeof args !== 'function') {
    if (!Array.isArray(args)) {
      throw new Error("args are expected to be an array or a function.");
    }
    queryArgs = () => args;
  }



  function runquery(req, res, format) {
    let args = queryArgs();
    return client
      .query(query, queryArgs())
      .then(({rows}) => {
        let {data, contentType} = formatResult(format, rows);

        res.set('Content-Type', contentType);
        return res.send(data)
      })
      .catch(err => {
        console.error("ERROR:", err);
        res.status(500);
        res.send("500: Internal server error");
      })
  }

  return function _pgResultCSV_Impl(req, res, next) {
    return runquery(req, res, req.query.format || format );
  }
}



module.exports = pgResultCSV;
