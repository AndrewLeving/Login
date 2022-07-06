const express = require('express')
const { User } = require("../persist/model");
const { Thread } = require("../persist/model");
const setUpAuth = require("./auth");
const setUpSession = require("./session");
const app = express()

app.use(express.json());

app.use(express.static(`${__dirname}/../public/`));


setUpSession(app);
setUpAuth(app);

app.post("/users", async (req, res) => {
    try {
        let user = await User.create({
            username: req.body.username,
            fullname: req.body.fullname,
            password: req.body.password,
        });
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({
            message: `post request failed to create user`,
            error: err,
        });

    }
});

app.get("/thread", async (req, res) => {
    try {
        threads = await Thread.find({}, "-posts");
    } catch (err) {
        res.status(500).json({
            message: `could not get threads`,
            error: err,
        });
    }
    for (let k in threads) {
        try {
            threads[k] = threads[k].toObject();
            let user = await User.findById(threads[k].user_id);
            threads[k].user = user;
        } catch (err) {
            console.log(`Could not find ${threads[k].user_id} in thread ${threads[k]._id}: ${err}`)
        }
    };
    res.status(200).json(threads);
});

app.get("/thread/:id", (req, res) => {
    console.log("thread/id");
});

app.post("/thread", async (req, res) => {
    // auth
    if (!req.user) {
        res.status(401).json({ message: "unauthed" });
        return;
    }
    // create with await + try/catch
    try {
        let thread = await Thread.create({
            user_id: req.user.id,
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
        });
        res.status(201).json(thread);
    } catch (err) {
        res.status(500).json({
            message: "could not create thread",
            error: err,
        });
    }
});

app.post("/post", (req, res) => {
    console.log("post/post");
});

app.delete("/thread/:threadid/post/:postid", (req, res) => {
    console.log("delete post");
});

app.delete("/thread/:threadid", (req, res) => {
    console.log("delete thread");
});

module.exports = app;