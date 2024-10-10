const express = require('express');
const app = express();
const port = 8080;
//const redirect_uri = 'http://localhost:8080/logged';
const mongoose = require('mongoose');
const Event = require('./models/events');

const dbURI = "mongodb+srv://spotifyuser:1234@spotifytmaster.ibvstnt.mongodb.net/event-db?retryWrites=true&w=majority&appName=SpotifyTmaster";


mongoose.connect(dbURI)
  .then((result) => console.log('connected to db'))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(express.static(__dirname));


app.post('/addevents', (req, res) => {
  console.log('Got to adding Event Page');
  const eventData = req.body;
  const event = new Event(eventData);

  event.save()
});

app.get('/getevents', (req, res) => {
  console.log('Getting the events')
  Event.find()
    .then((result) => {
      res.json(result);
    })
    .catch(err => {
      console.log(err);
    })
})

//deletes the user's events
app.delete('/deleteevents/:email', (req, res) => {
  const userEmail = req.params.email;
  console.log('In Server Trying to Delete');
  console.log('User Email:', userEmail);

  Event.deleteMany({ email: userEmail })
      .then(result => {
          console.log(`Deleted events associated with email: ${userEmail}`);
          
          //Success Deleting
          res.status(200).json({ message: `Deleted events associated with email: ${userEmail}` });
      })
      .catch(err => {
          console.error('Error deleting events:', err);
          
          //Failed Deleting
          res.status(500).json({ error: 'Error deleting events' });
      });
});

app.get('', (req, res) => {

  console.log('Got to Landing Page') //prints confirming we made redirect/callback

  res.sendFile(__dirname + "/spindex.html")

});

//redirect case, once we are logged in send to new logged in page
app.get('/logged', (req, res) => {

  console.log('Logged in and got to Logged Page') //prints confirming we made redirect/callback

  res.sendFile(__dirname + "/logged.html")

});


// Server Start Message:
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});