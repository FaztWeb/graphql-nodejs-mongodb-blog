const express = require("express");
const { config } = require("dotenv");
const { connectDB } = require("./db");
const { graphqlHTTP } = require("express-graphql");
const schema = require("./graphql/schema");
const { authenticate } = require("./middleware/auth");

config();

connectDB();

const app = express();

app.use(authenticate);

app.get("/", (req, res) => {
  res.json({ msg: "Welcome. Go to /graphql" });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

app.listen(process.env.PORT);
console.log("Server on port", process.env.PORT);
