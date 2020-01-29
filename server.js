const  express = require("express");
const path = require("path");
const fs = require("fs");
const util = require("util");

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const appendFileAsync = util.promisify(fs.appendFile);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true}));
app.use(express.json());

let nextID = 0;

async function setID() {
  return new Promise( (resolve, reject) => {
    console.log("looking for existing ids");
    fs.readFile("./db.json", "utf8", (err, data) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      console.log(data);
      console.log(JSON.parse(data));
      let jsonData = JSON.parse(data);
      nextID = jsonData[jsonData.length - 1].id + 1;
      console.log("Set nextID to" + nextID);
      resolve();
    });
  });
}

function getID() {
  const num = nextID;
  nextID++;
  return num;
}

//routes

app.get("/", (req, res) => {
  console.log("GET request received at *");
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/notes", (req, res) => {
  console.log("GET request received at /notes");
  res.sendFile(path.join(__dirname, "notes.html"));
});

app.get("/assets/css/styles.css", (req, res) => {
  console.log("GET request received at /assets/css/styles.css");
  res.sendFile(path.join(__dirname, "assets/css/styles.css"));
});

app.get("/assets/js/index.js", (req, res) => {
  console.log("GET request received at /assets/js/index.js");
  res.sendFile(path.join(__dirname, "assets/js/index.js"));
})

app.get("/api/notes", async (req, res) => {
  console.log("GET request received at /api/notes");
  try{
    const data = await readFileAsync("./db.json", "utf8");
    return res.json(data);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/api/notes", async (req, res) => {
  console.log("POST request received at /api/notes");
  let newNote = req.body;
  newNote.id = getID();
  try{
    await appendFileAsync("./db.json", JSON.stringify(newNote));
    return res.json(newNote);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.delete("/api/notes:id", async (req, res) => {
  console.log("DELETE request received at /api/notes:id");
  const target = req.params.id;
  try{
    const data = await readFileAsync("./db.json", "utf8");
    //find index of the target note
    let targetIndex = null;
    for(let i = 0; i < data.length; i++) {
      if(data[i].id === target) {
        targetIndex = i;
      }
    }
    //remove the target note
    if(targetIndex !== null) {
      data.splice(targetIndex, 1);
    }
    await writeFileAsync("./db.json", data);
    res.sendStatus(200);
  }
  catch(err) {
    console.log.length(err);
    res.sendStatus(500);
  }
});

//initialize the nextID value on server startup
setID()
.then( () => {
  app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
  });
});
