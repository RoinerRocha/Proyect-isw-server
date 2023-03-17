const express = require('express');
const cors = require("cors");
const mongoose = require("mongoose");
const db = mongoose.connect("mongodb://127.0.0.1:27017/proyecto");
const dbConnect = require('./mongodb');
const dbConnect2 = require('./mongodbp');
const mongodb = require('mongodb');
const mongodbp = require('mongodb');
const bodyParser = require("body-parser");
const Category = require("./models/category");
const NewSource = require("./models/newSource");
const Person = require("./models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "Qwertyuiopasdfghjkl()ñzxcvbnm[]qwsasdñlkmsdlsñldfkl";

const {
  base64decode
} = require('nodejs-base64');

const app = express();
app.use(bodyParser.json());
app.use(express.json())

// check for cors
app.use(cors({
  domains: '*',
  methods: "*"
}));

/*app.use(function (req, res, next) {
  if (req.headers["authorization"]) {
    console.log(req.headers["authorization"]);
    const authBase64 = req.headers['authorization'].split(' ');
    console.log('authBase64:', authBase64);
    const userPass = base64decode(authBase64[1]);
    console.log('userPass:', userPass);
    const user = userPass.split(':')[0];
    const password = userPass.split(':')[1];

    if (user === 'admin' && password == '1234') {
      // saveSession('admin');
      next();
      return;
    }
  }
  res.status(401);
  res.send({
    error: "Unauthorized"
  });
});*/

/*app.post("/user", async (req, res) => {
  const { fname, lname, email, password } = req.body;
  const encryptedPassword = await bcrypt.hash(password, 10);
  try {
    const oldUser =  await User.findOne({ email });
    if (oldUser) {
      res.status(409);
      return res.json({ error: "User Exist" });
    }
    User.create({
      fname: fname,
      lname: lname,
      email: email,
      password: encryptedPassword,
    });
    res.header({
      'location': `http://localhost:5000/user/?id=${User._id}`
    });
    res.status(201).json(User);
  } catch (error) {
    res.status(422);
    res.send({ status: "error" });
  }
});*/

//register user
app.post('/user', async (req, res) => {
  const User = mongoose.model("users");
  const person = new Person.model();
  const encryptedPassword = await bcrypt.hash(req.body.password, 10);
  const emailSearch = req.body.email;

  person.fname = req.body.fname;
  person.lname = req.body.lname;
  person.email = req.body.email;
  person.password = encryptedPassword;

  if (person.fname && person.email) {
    const oldUser = await User.findOne({email: emailSearch});
    if (oldUser) {
      console.log(emailSearch);
      res.status(409);
      return res.json({ error: "User Exist" });
    }
    person.save(function (err) {
      if (err) {
        res.status(422);
        res.json({
          error: 'There was an error saving the user'
        });
      }
      res.status(201);
      res.header({
        'location': `http://localhost:5000/user/?id=${person.id}`
      });
      res.json(person);
    });
  } else {
    res.status(422);
    console.log('error while saving the user')
    res.json({
      error: 'No valid data provided for user'
    });
  }
});

//authenticate user.
const User = mongoose.model("users");

app.post("/session", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ error: "User Not Found" });
  }
  if (await bcrypt.compare(password, user.password)) {
    console.log("ssss");
    const Token = jwt.sign({ email: user.email }, JWT_SECRET);

    if (res.status(201)) {
      return res.json({ status: "ok", data: Token });
    } else {
      return res.json({ status: "Error" });
    }
  }
  res.json({ status: "error", error: "Invalid password" });
});

app.post("/userData", async (req, res) => {
  console.log("papas");
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    console.log(user);
    const usermail = user.email;
    User.findOne({ email: usermail }).then((data) => {
      res.send({ status: "ok", data: data });
    }).catch((error) => {
      res.send({ status: "error", data: data });
    });
  } catch (error) { }
});

//post new category
app.post('/category', async (req, res) => {
  const cat = mongoose.model("categories");
  const category = new Category.model();

  category.name = req.body.name;

  if (category.name) {
    const check = await cat.findOne({name:req.body.name});
    if (check) {
      res.status(409);
      return res.json({ error: "Category already exist" });
    }
    category.save(function (err) {
      if (err) {
        res.status(422);
        res.json({
          error: 'There was an error saving the category'
        });
      }
      res.status(201);//CREATED
      res.header({
        'location': `http://localhost:5000/category/?id=${category.id}`
      });
      res.json(category);
    });
  } else {
    res.status(422);
    res.json({
      error: 'No valid data provided'
    });
  }
});

//delete category by id
app.delete('/category/:id', (req, res) => {
  const Category = mongoose.model("categories");
  const {id} = req.params;
  console.log(req.params);
  Category.findByIdAndDelete(id, function (err, docs) {
    if (err){
        res.status(404);
        res.json({error: 'Data not found'});
    }
    else{
      res.status(200);
      res.json();
    }
  })
});

//delete category by name
app.delete('/category2/:name', (req, res) => {
  const Category = mongoose.model("categories");
  const {name} = req.params;

  Category.findOneAndDelete({name: name}, function (err, docs) {
    if (err){
        res.status(404);
        res.json({error: 'Data not found'});
    }
    else{
      res.status(200);
      res.json();
    }
  })
});

//update categories
app.put('/category/:id', (req, res) => {
  const Category = mongoose.model("categories");
  const {id} = req.params;
  const name = req.body.name;

  Category.findByIdAndUpdate(id,{name: name},  function (err, docs) {
    if (err){
        res.status(404);
        res.json({error: 'Data not found'});
    }
    else{
      res.status(200);
      res.json();
    }
  })
});

//get category by name
app.get('/category/:name', async (req, res) => {
  const Category = mongoose.model("categories");
  const {name} = req.params;

  try{
    const cat = await Category.findOne({name: name})
    res.json(cat);

  }catch (error){
    res.status(422)
    res.json({error: "There was an error"})
  }
});

//get all categories
app.get('/category', async (req, res) => {
  const Category = mongoose.model("categories");

  try{
    const cat = await Category.find();
    res.json(cat);

  }catch (error){
    res.status(422)
    res.json({error: "There was an error"})
  }
});

//post news source
app.post('/newsource', async (req, res) => {
  const newSource = mongoose.model("newSources");
  const Category = mongoose.model("categories");
  const User = mongoose.model("users");
  const source = new NewSource.model();

  source.url = req.body.url;
  source.name = req.body.name;
  source.user_id = req.body.user_id;
  source.category_id = req.body.category_id;

  if (source.user_id && source.category_id) {
    const check = await User.findOne({_id: req.body.user_id});
    const check2 = await Category.findOne({_id: req.body.category_id});

    if (!check || !check2) {
      res.status(409);
      return res.json({ error: "There was an error" });
    }
    source.save(function (err) {
      if (err) {
        res.status(422);
        res.json({
          error: 'There was an error saving the category'
        });
      }
      res.status(201);//CREATED
      res.header({
        'location': `http://localhost:5000/category/?id=${source.id}`
      });
      res.json(source);
    });
  } else {
    res.status(422);
    res.json({
      error: 'No valid data provided'
    });
  }
});

/*app.put("/:name", async (req, resp) => {
  console.log(req.body);
  const data = await dbConnect();
  let result = data.updateOne(
    { name: req.params.name },
    { $set: req.body }
  )
  resp.send({ status: "updated" })
})

app.post('/players', function (req, res) {
  const player = new Player.model();
  player.first_name = req.body.first_name;
  player.last_name = req.body.last_name;
  player.age = req.body.age;

  //find the team
  console.log('team:', req.body.team);
  TeamModel.model.findById(req.body.team, (error, teamFound) => {
    console.log('error:', error);
    console.log('team:', teamFound);
    if (error) {

    }
    if (teamFound) {
      player.team = teamFound;
    }
    if (player.first_name && player.last_name) {
      player.save(function (err) {
        if (err) {
          res.status(422);
          console.log('error while saving the player', err);
          res.json({
            error: 'There was an error saving the player'
          });
        }
        res.status(201);//CREATED
        res.header({
          'location': `c/?id=${player.id}`
        });
        res.json(player);
      });
    } else {
      res.status(422);
      console.log('error while saving the player')
      res.json({
        error: 'No valid data provided for player'
      });
    }
  });

});

app.get('/players', async (res, resp) => {
  let data = await dbConnect2();
  data = await data.find().toArray();
  resp.send(data);
})

app.delete("/players/:id", async (req, resp) => {
  console.log(req.params.id);
  const data = await dbConnect2();
  const result = await data.deleteOne({ _id: new mongodbp.ObjectId(req.params.id) })
  resp.send(result)
})

app.put("/players/:first_name", async (req, resp) => {
  console.log(req.body);
  const data = await dbConnect2();
  let result = data.updateOne(
    { name: req.params.name },
    { $set: req.body }
  )
  resp.send({ status: "uptaded" })
})*/


app.listen(5000, () => console.log(`Example app listening on port 5000!`))
