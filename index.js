let expess = require("express");
let randomToken = require("random-token");
let app = expess();
let fs = require("fs");
const { v4: uuid } = require("uuid");
app.use(expess.urlencoded({ extended: true }));
app.use(expess.json());
app.use((req, res, next) => {
  if (req.url === "/") {
    next();
  }
  let apiKey = req.query.apiKey;
  // console.log(req.url);
  if (apiKey) {
    next();
  }
  if (
    req.url === "/user/create" ||
    req.url === "/user/login" ||
    req.url === "/db"
  ) {
    next();
  } else {
    let status = req.url.includes("/votes");
    if (status && req.query.apiKey) {
      next();
      // console.log(status);
    } else {
      return res.send({ status: "You are not allowed to vote." });
    }
  }
});

app.get("/", (req, res) => {
  res.send("App working");
});

app.get("/db", (req, res) => {
  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  res.json(data);
});

app.post("/db", (req, res) => {
  req.body.id = uuid();
  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  data.users = [req.body];
  fs.writeFileSync("./db.json", JSON.stringify(data), "utf-8");
  res.status(201).json({ status: "user created", id: req.body.id });
});

app.post("/user/create", (req, res) => {
  req.body.id = uuid();
  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  data.users = [...data.users, req.body];
  fs.writeFileSync("./db.json", JSON.stringify(data), "utf-8");
  res.status(201).json({ status: "user created", id: req.body.id });
});

app.post("/user/login", (req, res) => {
  if (req.body.username === undefined || req.body.password === undefined) {
    return res
      .status(400)
      .send({ status: "please provide username and password" });
  }

  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  let result = data.users.find((item) => {
    return (
      item.username === req.body.username && item.password === req.body.password
    );
  });
  if (!result) {
    return res.status(401).send({ status: "Invalid Credentials" });
  }
  result.token = randomToken(10);
  let token = result.token;
  data.users.map((item) => {
    if (item.username === req.body.username) {
      return (item = result);
    }
    return item;
  });
  fs.writeFileSync("./db.json", JSON.stringify(data), "utf-8");
  res.status(200).json({ status: "Login Successful", token });
});

app.post("/user/logout", (req, res) => {
  let token = req.query.apiKey;
  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  data.users.map((item) => {
    if (item.token === token) {
      delete item.token;
      return item;
    }
    return item;
  });
  fs.writeFileSync("./db.json", JSON.stringify(data), "utf-8");
  res.send({ status: "user logged out successfully" });
});

app.get("/votes/party/:party", (req, res) => {
  let party = req.params.party;
  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  let candidate = data.users.filter((item) => {
    return item.party === party;
  });
  res.send(candidate);
});

app.get("/votes/voters", (req, res) => {
  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  let voters = data.users.filter((item) => {
    return item.role === "voter";
  });
  res.send(voters);
});

app.post("/votes/vote/:user", (req, res) => {
  let user = req.params.user;
  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  data.users.map((item) => {
    if (item.name === user) {
      item.votes = item.votes + 1;
    }
  });
  fs.writeFileSync("./db.json", JSON.stringify(data), "utf-8");
  res.send("votes added successfully!");
});

app.get("/votes/count/:user", (req, res) => {
  let user = req.params.user;
  let data = fs.readFileSync("./db.json", "utf-8");
  data = JSON.parse(data);
  let totalVotes = data.users.filter((item) => {
    return item.name === user;
  });
  if (totalVotes == "") {
    return res.send({ status: "cannot find user" });
  }
  let x = totalVotes[0].votes;
  res.send({ status: x });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
