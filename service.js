const serverless = require('serverless-http');
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const _ = require('lodash');



const AWS = require('aws-sdk');
const uuid = require('node-uuid');
const { BOOK_TABLE, IS_OFFLINE } = process.env;



const dynamoDb = IS_OFFLINE === 'true' ?
new AWS.DynamoDB.DocumentClient({
  region: 'localhost',
  endpoint: 'http://127.0.0.1:8000',
}) :
new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));



app.get('/', (req, res) => {
  return res.send({
    message: 'Hello ',
  });
})

app.get('/books', (req, res) => {
  const params = {
    TableName: BOOK_TABLE,
  };
  dynamoDb.scan(params, (error, result) => {

    if (error) {
      res.status(400).json({ error: 'Error retrieving books' });
    }
    const { Items: books } = result
    res.json({ books });
  })
});

app.get('/book/:bookId', (req, res) => {
  const { bookId } = req.params;
  const params = {
    TableName: BOOK_TABLE,
    Key: {
      bookId,
    },
  };
  dynamoDb.get(params, (error, result) => {
    if (error) {
      res.status(400).json({ error: 'Error retrieving Book' });
    }
    if (!_.isEmpty(result.Item)) {
      const { bookId, releaseDate, authorName, bookName } = result.Item;
      res.json({ bookId, releaseDate, authorName, bookName });
    } else {
      res.status(404).json({ error: `Book with id: ${bookId} not found` });
    }
  });
});

app.post('/book', (req, res) => {
  const {
    bookName,
    authorName
  } = req.body;
  const bookId = uuid.v4();
  const params = {
    TableName: BOOK_TABLE,
    Item: {
      bookId,
      bookName,
      releaseDate: (new Date()).toISOString(),
      authorName
    },
  };
   dynamoDb.put(params, (error, result)  => {
     console.log(">>>>>>>>  ", error, " >>>>>>>>>>>>>>  ", result)
    if (error) {
      res.status(400).json({ error: 'Could not create Book', error });
    }else {

      res.send({ data: "Book Saved Successfully" });
    }
  });

});



app.put('/book', (req, res) => {
  var params = {
    TableName: BOOK_TABLE,
    Key:{
      bookId :req.body.bookId 
    },
    UpdateExpression: "set bookName=:n, releaseDate=:r, authorName=:a",
    ExpressionAttributeValues:{
        ":n":req.body.bookName,
        ":r":req.body.releaseDate,
        ":a":req.body.authorName
    },
    ReturnValues:"UPDATED_NEW"
  };
  dynamoDb.update(params, (error,result) => {
    if (error) {
      res.status(400).json({ error: 'Could not update Book' });
    }
    res.json({ ...result.Attributes , message: "Book updated Successfully"});
  })
});

app.delete('/book/:bookId', (req, res) => {
  const { bookId } = req.params;
  const params = {
    TableName: BOOK_TABLE,
    Key: {
      bookId,
    },
  };
  dynamoDb.delete(params, (error) => {
    if (error) {
      res.status(400).json({ error: 'Could not delete Book' });
    }
    res.json({ success: true , message: "Book Delete Successfully" });
  });
});




module.exports.handler = serverless(app);
