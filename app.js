const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1/todolistDB");

const itemScema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemScema);

const listScema = new mongoose.Schema({
  name: String,
  items: [itemScema]
});

const List = mongoose.model("List", listScema);

const item1 = new Item({
  name: "Welcome to todolist!!",
});

const item2 = new Item({
  name: "Hit the + button to add new items.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an itme.",
});

const defaultItems = [item1, item2, item3];

async function insertManyItems() {
  try {
    const saveData = await Item.insertMany(defaultItems);
    console.log(`Successfully inserted ${saveData}`);
  } catch (error) {
    console.log(error.message);
  }
}


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  async function findAllItems() {
    try {
      const foundItems = await Item.find();
      if (foundItems.length === 0) {
        insertManyItems();
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", addListItems: foundItems });
      }
    } catch (error) {
      console.log(error.message);
    }
  }
  findAllItems();
});


app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  const list = new List({
    name: customListName,
    items: defaultItems
  });

  async function findCustomName() {
    try {
      const document = await List.findOne({name: customListName}).exec();
      if (document) {
        res.render("list", { listTitle: document.name, addListItems: document.items })
      } else {
        async function insertCustomName() {
          try {
            await list.save();
          } catch (error) {
            console.log(error.message);
          }
        }
        insertCustomName();
        res.redirect("/" + customListName);
      }
    } catch (error) {
      console.error('Error finding document:', error);
    }
  }
  findCustomName()
});


app.post("/", (req, res) => {
  const itemName = req.body.addNewItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    async function insertOneItem () {
      try {
        const saveItem = await item.save();
        console.log(saveItem);
      } catch (error) {
        console.log(error.message);
      }
    }
    insertOneItem();
    res.redirect("/");
  } else {
    async function findListName() {
      try {
        const foundList = await List.findOne({name: listName});
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      } catch (error) {
        console.log(error.message);
      }
    }
    findListName();
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    async function deleteItemById () {
      try {
        const result = await Item.deleteOne({_id: checkedItemId,}).exec();
        if (result.deletedCount === 1) {
          console.log("Document deleted successfully");
        } else {
          console.log("No document found that matches the condition.");
        }
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
    deleteItemById();
    res.redirect("/");
  } else {
    async function findAndUpdat() {
      try {
        const updatedDocument = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).exec();
        if (updatedDocument) {
          console.log('Updated document:', updatedDocument);
          res.redirect("/" + listName);
        } else {
          console.log('No document found that matches the condition.');
        }
      } catch (error) {
        console.error('Error updating document:', error);
      }
    }
    findAndUpdat();
  }
})

app.get("/work", (req, res) => {
  res.render("list", { listTitle: "Work-List", addListItems: workLists });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("The server is running on localhost:3000");
});
