const express = require("express");
const cors = require("cors");
const calculateRoute = require("./routes/calculateRoute");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.use("/calculate", calculateRoute);

app.listen(port, () => console.log(`Server running on port ${port}`));