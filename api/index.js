const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const url = process.env.URI;
mongoose.connect(url).then(()=>{
    console.log("connection successfull")
}).catch((err) => {console.log("connection failed");});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({name: "Welcome to the Todo List"});
const item2 = new Item({name: "Type and hit the + button to add a new item"});
const item3 = new Item({name: "<-- Click the checkbox to delete item"});
const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/",function(req,res){
    Item.find({}).then(function(foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems);
            res.redirect("/");
        }else{
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.post("/", function(req, res){
    let itemName = req.body.newItem;
    let listName = req.body.list;

    const item = new Item({name: itemName});
    
    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    };
});

app.post("/delete", function(req, res){
    const deleteId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndDelete(deleteId).catch(err => {console.error('there was an error', err)});
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: deleteId}}}).then(function(foundList){
            res.redirect("/" + listName);
        });
    };
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    if(customListName === 'About'){
        res.render("about");
    }else{
        List.findOne({name: customListName}).then(function(foundList){
            if(!foundList){
                const customList = new List({
                    name: customListName,
                    items: defaultItems
                });
                customList.save();
                res.redirect("/"+ customListName);
            }else{
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        });
    }
    
})

app.get("/work", function(req, res){
    res.render("list", {listTitle: "Work List", newListItems: workItems})
});

app.post("/work", function(req, res){
    let item = req.body.newItem;
    workItems.push(item);
    res.redirect("/work");
});

app.get("/about", function(req, res){
    res.render("about");
});

app.listen(3000, function(req,res){
    console.log("Server is up and running on port 3000");
});
