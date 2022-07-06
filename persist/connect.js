const mongoose = require('mongoose');
const db = mongoose.connection;

async function connect(user, pass, host, db_name, port) {
    const connectionString = `mongodb+srv://${user}:${pass}@cluster0.ixjzc.mongodb.net/?retryWrites=true&w=majority`
    try {
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        console.log("error connecting to mongoose, err");
    }
}

function onConnect(callback) {
    db.once("open", () => {
        console.log("mongo connection open")
        callback();
    })
}

module.exports = {
    connect,
    onConnect,
}