const express = require('express');
const cors = require("cors");
const mongoose = require("mongoose");
const db = mongoose.connect("mongodb://127.0.0.1:27017/proyecto");
const bodyParser = require("body-parser");
const Parser = require("rss-parser");
const Category = require("./models/category");
const NewSource = require("./models/newSource");
const News = require("./models/news");
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

//token authorization
/*app.use(function (req, res, next) {
  if (req.headers["authorization"]) {
    const token = req.headers['authorization'].split(' ')[1];
    try {
      //validate if token exists in the database
      const session = getSession(token);
      session.then(function (session) {
        if (session) {
          next();
          return;
        } else {
          res.status(401);
          res.send({
            error: "Unauthorized "
          });
        }
      })
      .catch(function(err){
        console.log('there was an error getting the session', err);
        res.status(422);
        res.send({
          error: "There was an error: " + e.message
        });
      });

    } catch (e) {
      res.status(422);
      res.send({
        error: "There was an error: " + e.message
      });
    }
  } else {
    res.status(401);
    res.send({
      error: "Unauthorized "
    });
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
  person.role = req.body.role

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
    const Token = jwt.sign({ email: user.email, role: user.role,id: user.id }, JWT_SECRET);

    if (res.status(201)) {
      return res.json({ status: "ok", data: Token });
    } else {
      return res.json({ status: "Error" });
    }
  }
  res.json({ status: "error", error: "Invalid password" });
});

app.get('/checktoken', async (req, res) => {
  const token = req.body.token;

  try{
    const data = jwt.decode(token)
    res.json(data);

  }catch (error){
    res.status(422)
    res.json({error: "There was an error"})
  }
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
app.get('/category2/:name', async (req, res) => {
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

//get category by id
app.get('/category/:id', async (req, res) => {
  const Category = mongoose.model("categories");
  const {id} = req.params;

  try{
    const cat = await Category.findById(id)
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

//delete category by id
app.delete('/newsource/:id', (req, res) => {
  const NewSource = mongoose.model("newSources");
  const {id} = req.params;

  NewSource.findByIdAndDelete(id, function (err, docs) {
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

//update new sources
app.put('/newsource/:id', (req, res) => {
  const NewSource = mongoose.model("newSources");
  const {id} = req.params;
  const url = req.body.url;
  const name = req.body.name;
  const user_id = req.body.user_id;
  const category_id = req.body.category_id;

  NewSource.findByIdAndUpdate(id,{url: url, name: name, user_id: user_id, category_id: category_id}, function (err, docs) {
    //const s = await Category.find();
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

//get news source by id
app.get('/newsource/:id', async (req, res) => {
  const NewSource = mongoose.model("newSources");
  const {id} = req.params;

  try{
    const source = await NewSource.findById(id)
    res.json(source);

  }catch (error){
    res.status(422)
    res.json({error: "There was an error"})
  }
});

//get all news sources
app.get('/newsource', async (req, res) => {
  const NewSource = mongoose.model("newSources");

  try{
    const source = await NewSource.find()
    res.json(source);

  }catch (error){
    res.status(422)
    res.json({error: "There was an error"})
  }
});

//Read the RSS and insert the news associated to the owner of the newsource 
app.post('/newsource/:id/process', async (req, res) => {
  //RSS Parser
  const parser = new Parser();
  const NewSource = mongoose.model("newSources");
  const {id} = req.params;

  // Get all the items in the RSS feed
  const source = await NewSource.find({user_id: id});
  console.log(source);
  const out = [];
  
  if(source){
    source.forEach(async elementN => {
      const feed = await parser.parseURL(elementN.url);
      feed.items.forEach(async element => {
        const news = new News.model();
        news.title = element.title,
        news.short_description = element.contentSnippet,
        news.permalink = element.link,
        news.date = element.isoDate,
        news.news_sources_id = elementN.id,
        news.user_id = elementN.user_id,
        news.category_id = elementN.category_id
    
        await news.save();
        await out.push(element);
      });
    });
  }else{
    res.status(404);
    res.json("Not found");
  }
  res.json({out});
});

//get all news by user id
app.get('/news/:id', async (req, res) => {
  const News = mongoose.model("news");
  const {id} = req.params;

  try{
    const news = await News.find({user_id: id});
    res.json(news);

  }catch (error){
    res.status(422)
    res.json({error: "There was an error"})
  }
});

//get all news by user id and category
app.get('/news/:id/:cat', async (req, res) => {
  const News = mongoose.model("news");
  const id = req.params.id;
  const cat = req.params.cat;

  try{
    const news = await News.find({user_id: id, category_id: cat});
    res.json(news);

  }catch (error){
    res.status(422)
    res.json({error: "There was an error"})
  }
});

app.listen(5000, () => console.log(`Example app listening on port 5000!`))
