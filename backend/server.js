const RED = require("node-red");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

// Node-RED settings
const settings = {
  httpAdminRoot: "/admin",   // Node-RED editor at /admin
  httpNodeRoot: "/",
  userDir: "./nodered-data/",
  flowFile: "../mes-backend-flow.json",  // use our committed flow
  functionGlobalContext: {},
  editorTheme: {
    page: { title: "Lear MES — Node-RED" }
  },
  // Allow all origins so React dashboard can connect
  httpAdminCors: {
    origin: "*",
    methods: "GET,PUT,POST,DELETE"
  }
};

RED.init(server, settings);

app.use(settings.httpAdminRoot, RED.httpAdmin);
app.use(settings.httpNodeRoot, RED.httpNode);

// Health check endpoint for Render
app.get("/health", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 1880;
server.listen(PORT, () => {
  console.log(`Lear MES Node-RED backend running on port ${PORT}`);
});

RED.start();
