var express = require('express');

var app = express();
app.use(express.static('maincss'))
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const path = require('path');
const port = process.env.PORT || 3000;

app.listen(process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
//app.set('views', '/views');

var fs = require("firebase-admin");
let serviceAccount;
if (process.env.GOOGLE_CREDENTIALS != null) {
    serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS)
    //console.log('GOOGLE_CREDENTIALS != null')
        // private_key = (`${process.env.private_key}`).replace(/\\n/g, '\n')
} else {
    serviceAccount = require("./kpopmerchandise-ffee7-firebase-adminsdk-8miny-a06d502298.json")
    //console.log('GOOGLE_CREDENTIALS = null')
}
fs.initializeApp({
    credential: fs.credential.cert(serviceAccount)
});

const db = fs.firestore();
const itemsColl = db.collection('items');

app.get('/', async function(req, res) {
    const items = await itemsColl.get();
    //console.log(items.docs.length);
    let datas = {
        url: req.url,
        itemData: items.docs,
    }
    res.render('home', datas);
});

app.get('/products', async function(req, res) {
    const items = await itemsColl.get();
    
    let datas = {
        url: req.url,
        "itemData": items.docs,
    }
    
    res.render('products', datas);
});

app.get('/product_details/:item_id',  async function(req, res) {
    let item_id = req.params.item_id;
    let item = await itemsColl.doc(item_id).get();
    const sales = await db.collection("items/"+item_id+"/sales").get();
    
    
    let datas = {
        "itemData": item.data(),
        "item_sales":sales.docs,
        item_id: item_id
        
    }
    
    sales.docs.forEach(function(doc) {
        console.log(doc.id, " => ", doc.data());
        //console.log("--------------------")
        
    });

    res.render('product_details', datas);
});

app.post('/product_details/:item_id',  urlencodedParser, async function(req, res) {
    let quantity_added = req.body.quantity; 
    let current_date = new Date()
    let item_id = req.params.item_id;
    let item = await itemsColl.doc(item_id).get();
    const sales = await db.collection("items/"+item_id+"/sales").get();
    
    console.log(item.data()["name"])

    let totalsales;
    try{   
        totalsales = parseInt(item.data().sales_count);
    }
    catch{
        totalsales = 0
    }
    let length;
    length = sales.docs.length + 1;
    length = length.toString();

    db.collection("items").doc(item_id).update({sales_count: totalsales + parseInt(quantity_added)}); //UPDATE total_sales

    db.collection("items/"+item_id+"/sales").doc(length).set({ //ADD new sales
        "date": current_date,
        "quantity_added": quantity_added,
    });


    let item2 = await itemsColl.doc(item_id).get();
    const sales2 = await db.collection("items/"+item_id+"/sales").get();

    let datas = {
        "itemData": item2.data(),
        "item_sales":sales2.docs,
        item_id: item_id, 
    }
    
    res.render('product_details', datas);
});

app.get('/product_details_edit/:item_id',  async function(req, res) {
    let item_id = req.params.item_id;
    let item = await itemsColl.doc(item_id).get();

    let datas = {
        "itemData": item.data(),    
    }
    
    res.render('product_details_edit', datas);
});

app.post('/product_details_edit/:item_id',  urlencodedParser, async function(req, res) {
    let new_name = req.body.name; 
    let new_price = req.body.price; 
    let item_id = req.params.item_id;
    let item = await itemsColl.doc(item_id).get();
   
    db.collection("items").doc(item_id).update({
        name: new_name,
        price: new_price
    }); //UPDATE

    
    res.redirect('/product_details/' +item_id);
});





