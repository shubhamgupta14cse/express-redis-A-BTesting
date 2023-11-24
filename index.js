const express = require('express');
const redis = require('redis');
var cookies = require("cookie-parser");


const app = express();
const client = redis.createClient();

client.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.log(err.message);
})

app.use(cookies());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// logic

function generateTempId() {
    return Math.random().toString(36).substring(2, 15);
}

// this fn return layout based out of index 
function getlayout(index) {
    const layouts = ['Layout1', 'Layout2', 'Layout3']
    return layouts[index];
}


// ceate a function to map userId to index 
async function getABTestGroupIndex(userId) {
    const totaGroup = 3;
    const userHash = 'user' + userId;
    
    let groupIndex = await client.hGet(userHash, 'groupIndex');
    let randomNo = await client.get('randomNo');

    if (groupIndex === null) {
        if (randomNo === null) {
            randomNo = 0
        } 
        groupIndex = (randomNo++) % totaGroup
        await client.set('randomNo', randomNo)
        await client.hSet(userHash, 'groupIndex', groupIndex)
    }
    return groupIndex;
}

app.get('/layout', async (req, res) => {
    let userId = req.cookies.userId;

    if(!userId) {
        // create  and assign a user id to take care of guest
        userId = generateTempId();
        res.cookie('userId', userId);
    }

    // get layout for that user
    const layoutIndex = await getABTestGroupIndex(userId);
    const selectedLayout = getlayout(layoutIndex);

    res.json({ layout: selectedLayout })

})

app.listen(4000, () => {console.log(" there server is listening")});
