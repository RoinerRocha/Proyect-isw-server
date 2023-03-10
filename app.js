const express = require("express");
const app = express();
app.use(express.json())

app.listen(5000, () => {
    console.log("server started");
});

app.post("/post", async (req, res) => {
    console.log(req.body);
    const { data } = req.body;
    try{
        if (data1 == "roiner") {
            res.send({ status: "ok" });
        }else{
            res.send({status:"user not found"});
        }
    }catch(error){
        res.send({status:"something went wrong, try again"});
    }
    

});

