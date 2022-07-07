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
            open: true,
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

    let checkThread;

    try {
        checkThread = await Thread.findById(req.body.thread_id);
        if (!checkThread) {
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

    if (!checkThread.open) {
        res.status(403).json({ message: "Thread is closed" });
        return;
    }

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

app.delete("/thread/:threadid/post/:postid", async (req, res) => {
    //Check authentication
    if (!req.user) {
        res.status(401).json({ message: "unauthed" });
        return;
    }
    //get post
    let thread;
    try {
        thread = await Thread.findOne({
            _id: req.params.threadid,
            "posts._id": req.params.postid,
        })
            ;
        if (!thread) {
            res.status(404).json({
                message: "thread/post not found"
            });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: "failed to pull post for deletion",
            error: err,
        });
        return;
    }
    //Check authorization
    thread.posts.forEach(post => {
        if (post._id === req.params.postid) {
            if (post.user_id != req.user.id) {
                res.status(403).json({ message: "Forbidden" });
                return;
            }
        }
    })

    //Delete Post
    let deletedPost;
    try {
        deletedPost = await Thread.findByIdAndUpdate(
            req.params.threadid,
            {
                $pull: {
                    posts: {
                        _id: req.params.postid,
                    },
                },
            },
            {
                new: true
            }
        );
        if (!deletedPost) {
            res.status(404).json({
                message: "post not found",
                thread_id: req.params.threadid,
                post_id: req.params.postid,
            });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: "failed to delete post",
            error: err,
        });
        return;
    }
    res.status(200).json(deletedPost);
});

app.delete("/thread/:threadid", async (req, res) => {
    //Check authentication
    if (!req.user) {
        res.status(401).json({ message: "unauthed" });
        return;
    }
    //get Thread
    let thread;
    try {
        thread = await Thread.findById(req.params.threadid);
        if (!thread) {
            res.status(404).json({
                message: "Thread not found"
            });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: "failed to pull thread for deletion",
            error: err,
        });
        return;
    }
    //Check authorization
    if (thread.user_id != req.user.id) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }
    let deletedThread;
    try {
        deletedThread = await Thread.findByIdAndDelete(req.params.threadid);
        if (!deletedThread) {
            res.status(404).json({
                message: "Deleted Thread not found"
            });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: "failed to delet thread",
            error: err,
        });
        return;
    }
    res.status(200).json(deletedThread);
});

app.patch("/thread/:id/:closeBool", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({ message: "unauthed" });
        return;
    }
    let thread;

    //get thread
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
            message: "failed to pull thread for status update",
            error: err,
        });
        return;
    }

    //Check authorization
    if (thread.user_id != req.user.id) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    //close-open thread
    let changedThread;
    try {
        changedThread = await Thread.findByIdAndUpdate(
            req.params.id,
            {
                open: req.params.closeBool
            },
            {
                new: true
            }
        );
        if (!changedThread) {
            res.status(404).json({ message: "thread not found while updating" });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: "failed to update thread status",
            error: err,
        });
        return;
    }
    res.status(200).json(changedThread);
});

module.exports = app;