//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");    // npm module

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");
const todoSchema = new mongoose.Schema({
  name:{
    type:String,
    require:[true, "Please enter a To-do"]
  }
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [todoSchema]
});
const Item = mongoose.model("Item", todoSchema);
const List = mongoose.model("List", listSchema);

const defaultItems = [{name:"Welcome! Add your task here."}];

// Root route
app.get("/", async(req, res) =>{
  const result = await Item.find({});
  if(result.length===0){
    Item.insertMany(defaultItems);
    res.redirect("/");
  }
  else{
    res.render("list", {listTitle:"Today", newListItems: result});
  }
});

// Adding new todo-items
app.post("/", async(req, res)=>{

  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const item = new Item({name:itemName});
  if(listTitle === "Today"){
    item.save();
    res.redirect("/");
  }
  else{   // for adding into custome list
    const resultListItem = await List.findOne({name: listTitle});
    const customListItems = resultListItem.items;
    customListItems.push(item);
    await List.findOneAndUpdate({name: listTitle}, {items: customListItems}, {new: true});
    res.redirect("/"+listTitle);
  }
});

//Deleting Items
app.post("/delete", async(req, res)=>{
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today"){   // we are in default list.
    try {
      await Item.findByIdAndDelete(checkedItem);
      res.redirect("/");
    } catch (err) {
      console.error("Error deleting item:", err);
      res.status(500).send("Error deleting item");
    }
  }
  else{
    await List.findOneAndUpdate( {name: listName}, {$pull: {items: {_id: checkedItem}}}, {new:true} );
    res.redirect("/"+listName);
  }
});

// Creating custome Lists
app.get("/:customListName", async(req,res)=>{
  const customListName = _.capitalize(req.params.customListName);

  const result = await List.findOne({name:customListName});
  if(!result){
    // create a new list.
    const list = new List({
      name: customListName,
      items: defaultItems 
    });
    list.save();
    res.redirect(`/${customListName}`);
  }
  else{
    res.render("list", {listTitle: result.name, newListItems: result.items});
  }
  
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
