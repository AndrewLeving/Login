const session = require("express-session");

const setUpSessionStore = function (app) {
    app.use(session({
        secret: "thecatwasblack",
        resave: false,
        saveUninitualized: false,
    }))
}

module.exports = setUpSessionStore;