const app = require("./server/server");
const { connect, onConnect } = require("./persist/connect");

// put in command line flags
const flags = require("flags");
flags.defineNumber("port", 3000, "Port for the http server to listen to.");
flags.parse();

// put in env vars
require('dotenv').config();
//set up port number
const port = flags.get("port") || process.env.PORT || 4000;

onConnect(() => {
    app.listen(port, () => {
        console.log(`serving on port ${port}`);
    });
})

try {
    connect(process.env.USER, process.env.PASSWORD);
} catch (err) {
    console.log(err);
    throw "couldnt start"
}
