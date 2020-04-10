const serverless = require('serverless-http');
const express = require('express')
const app = express()
const bodyParser = require('body-parser');

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
    const { Items: books } = result;
    res.json({ books });
  })
});

app.post('/book', (req, res) => {
  const {
    bookId,
    name,
    authorName
  } = req.body;
  const bookId = uuid.v4();
  const params = {
    TableName: BOOK_TABLE,
    Item: {
      bookId,
      name,
      releaseDate: new Date.now(),
      authorName
    },
  };
   dynamoDb.put(params, (error) => {
    if (error) {
      res.status(400).json({ error: 'Could not create Book', error });
    }else {

      res.send({ data: "Data saved Success" });
    }
  });

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
    if (result.Item) {
      const { bookId, title, done } = result.Item;
      res.json({ bookId, title, done });
    } else {
      res.status(404).json({ error: `Book with id: ${bookId} not found` });
    }
  });
});

app.put('/book', (req, res) => {
  const { bookId, title, done } = req.body;
  var params = {
    TableName: BOOK_TABLE,
    Key: { bookId },
    UpdateExpression: 'set #a = :title, #b = :done',
    ExpressionAttributeNames: { '#a': 'title', '#b': 'done' },
    ExpressionAttributeValues: { ':title': title, ':done': done },
  };
  dynamoDb.update(params, (error) => {
    if (error) {
      res.status(400).json({ error: 'Could not update Book' });
    }
    res.json({ bookId, title, done });
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
    res.json({ success: true });
  });
});



app.get('/', function (req, res) {
  res.send('Hello World!')
})

module.exports.handler = serverless(app);
