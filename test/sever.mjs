import express from "express";

function startServer() {
  const app = express();

  express.static.mime.define({'application/json': ['contract']})

  app.use(express.static("dist"));

  const port = process.env.PORT || 8011;

  console.log("App listening to http://127.0.0.1:" + port);

  app.listen(port, '127.0.0.1');
}

export default startServer;
