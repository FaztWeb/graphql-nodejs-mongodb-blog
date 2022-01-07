const app = require("./app");
const { connectDB } = require("./db");
const { PORT } = require("./config");

connectDB();
app.listen(PORT);
console.log("Server on port", PORT);
