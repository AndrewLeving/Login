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
    let threads;
    try {
        threads = await Thread.find({}, "-posts");
    } catch (err) {
        res.status(500).json({
            message: `could not get threads`,
            error: err,
        });
        return;
    }
    for (let k in threads) {
        try {
            threads[k] = threads[k].toObject();
            let user = await User.findById(threads[k].user_id, "-password");
            threads[k].user = user;
        } catch (err) {
            console.log(`Could not find ${threads[k].user_id} in thread ${threads[k]._id}: ${err}`)
        }
    };
    res.status(200).json(threads);
});

app.get("/thread/:id", async (req, res) => {
    let thread;
    try {
        thread = await Thread.findById(req.params.id);
        if (!thread) {
            res.status(404).json({
                message: "Thread not found"
            });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `Error getting thread:${req.params.id}`,
            error: err
        })
        return;
    }
    try {
        thread = thread.toObject();
        let user = await User.findById(thread.user_id, "-password");
        thread.user = user;
    } catch (err) {
        console.log(`Could not find ${thread.user_id} in thread ${thread._id}: ${err}`)
    }
    for (let p in thread.posts) {
        try {
            let postUser = await User.findById(thread.posts[p].user_id, "-password");
            thread.posts[p].user = postUser;
        } catch (err) {
            console.log(`Could not find ${thread.posts[p].user_id} in post ${thread.posts[p]._id}: ${err}`)
        }
    }
    res.status(200).json(thread);
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

app.post("/post", async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: "unauthed" });
        return;
    }

    let thread;

    try {
        thread = await Thread.findByIdAndUpdate(
            req.body.thread_id,
            {
                $push: {
                    posts: {
                        user_id: req.user.id,
                        body: req.body.body,
                        thread_id: req.body.thread_id
                    }
                }
            },
            {
                new: true
            }
        );
        if (!thread) {
            res.status(404).json({
                message: "thread not found",
                id: req.body.thread_id,
            });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: "failed to insert post",
            error: err,
        });
        return;
    }
    res.status(201).json(thread.posts[thread.posts.length - 1]);
});

app.delete("/thread/:threadid/post/:postid", (req, res) => {
    console.log("delete post");
});

app.delete("/thread/:threadid", (req, res) => {
    console.log("delete thread");
});

module.exports = app;