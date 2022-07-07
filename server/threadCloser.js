
const { Thread } = require("../persist/model");

async function compareTime() {
    console.log("Checking Threads for closing")
    let currentTime = new Date().getTime();
    let threads;
    try {
        threads = await Thread.find({}, "-posts");
        if (!threads) {
            console.log("could not find threads to check close");
        }
        console.log("found threads")
    } catch (err) {
        console.log(err);
    }
    let found = false;
    for (let k in threads) {
        editTime = threads[k].updatedAt.getTime();
        let newThread;
        if (currentTime - editTime > 120000 && threads[k].open) {
            found = true;
            try {
                newThread = await Thread.findByIdAndUpdate(
                    threads[k]._id,
                    {
                        open: false,
                    }
                );
                if (!newThread) {
                    console.log("could not find thread when trying to close");
                }
                else {
                    console.log(`Closed thread id: ${newThread._id}`);
                }
            } catch (err) {
                console.log(err);
            }
        }
    };
    if (!found) {
        console.log("No Threads found to close");
    }
}

let checkClosed = function (checkTime) {
    setInterval(compareTime, checkTime);
}

module.exports = {
    checkClosed,
} 