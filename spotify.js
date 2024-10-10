
var client_id = 'b59d20206fbd49c5b3b6c557379072f1';
var client_secret = '17447b0e8c4c44cbb3d1d1f8e91be763';

var redirect_uri = 'http://localhost:8080/logged';


//Ticketmaster specific API info:
var TM_API_KEY = "ShDtYzKA7xFQVdYyNeSi3w1JAdK8T7o1";
var TM_CONSUMER_SECRET = "NW1pxoIOaHhAVDob";
var TM_URL = "https://app.ticketmaster.com/discovery/v2";

//const AUTHORIZE = "https://accounts.spotify.com/authorize";

//Use this website for generating specific spotify "top" api calls
//https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
const TRACKS = "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=10&offset=0";
const ARTISTS = "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=10";

var USER_EMAIL = "";


const TOKEN = "https://accounts.spotify.com/api/token";
var ACCESS_TOKEN = "";

//Useful Spotify API 
//Link: https://developer.spotify.com/documentation/web-api/tutorials/getting-started

//treat scope as the permissions the user is giving us
//ex - user-read-recently-played: allows us to use API calls related to the user's recently played songs/artists
var scope = 'user-top-read user-read-recently-played playlist-read-private user-read-private user-read-email';

function authorize() {
  let url = "https://accounts.spotify.com/authorize";
  url += '?client_id=' + client_id;
  url += '&response_type=code';
  url += '&redirect_uri=' + encodeURI(redirect_uri);
  url += "&show_dialog=true";
  url += '&scope=' + scope;


  window.location.href = url;

}

//This function is called when we load the logged.html page (after logging into Spotify)
function onPageLoad() {
  if (window.location.search.length > 0) {
    handleRedirect();

  } else {
    //Can do additional calls for functions/API calls here

  }
}

function handleRedirect() {
  let code = getCode();
  //console.log(code);
  if (code === null) {
    // If the user did not log in correctly, send back to home page
    window.location.href = 'http://localhost:8080';
  } else {
    // User signed in, so carry on normally (go to logged in page)
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri);
  }
}

function getCode() {
  let code = null;
  const queryString = window.location.search;
  if (queryString.length > 0) {
    const urlParams = new URLSearchParams(queryString);
    code = urlParams.get('code');
  }
  //console.log(code);
  return code;
}

function fetchAccessToken(code) {
  let body = "grant_type=authorization_code";
  body += "&code=" + code;
  body += "&redirect_uri=" + encodeURI(redirect_uri);
  body += "&client_id=" + client_id;
  body += "&client_secret=" + client_secret;

  callAuthApi(body);
}

function callAuthApi(body) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", TOKEN, true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
  xhr.send(body);
  xhr.onload = handleAuthResponse;
}

function handleAuthResponse() {
  if (this.status == 200) {
    var data = JSON.parse(this.responseText);
    if (data.access_token != undefined) {
      access_token = data.access_token;
      console.log("Access Token: " + access_token);
      ACCESS_TOKEN = access_token;
      localStorage.setItem("access_token", access_token);
      getUserEmail();
    }

    //do api call

  } else {
    console.log(this.responseText);
    alert(this.responseText);
  }
}



//General Spotify API calling method, use this format for calling spotify APIS
function callAPI(method, url, body, callback) {
  let xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("access_token"));
  xhr.send(body);
  xhr.onload = callback;
}



//API CALL HANDLING

function handleArtistResponse() {
  if (this.status == 200) {
    var data = JSON.parse(this.responseText);
    var artistNames = data.items.map(artist => artist.name);
    //console.log(data);
    //console.log(artistNames);
    //need function to display/format songs here
    for (let i = 0; i < artistNames.length; i++) {
      //console.log(artistNames[i]);
      //var potential_event;

      setTimeout(() => {
        searchEvents(artistNames[i]);
      }, i * 300);

    }


  }
  else {
    console.log(this.responseText);
    alert(this.responseText);
  }
}



function getArtists() {
  callAPI("GET", ARTISTS, null, handleArtistResponse);
  setTimeout(() => { getEvents(); }, 3000);
}

function handleSongResponse() {
  if (this.status == 200) {
    var data = JSON.parse(this.responseText);
    //need to map data similarly to artist names above
    console.log(data);
    //need function to display/format songs here
  }
  else {
    console.log(this.responseText);
    alert(this.responseText);
  }
}


function getSongs() {
  callAPI("GET", TRACKS, null, handleSongResponse);
  // Need to delay for time of API calls
  setTimeout(() => { getEvents(); }, 5000);
}

function searchEvents(artistName) {

  const url = `${TM_URL}/events.json?apikey=${TM_API_KEY}&keyword=${encodeURIComponent(artistName)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      //check for valid events (non-empty) in the data
      if (data.page.totalElements > 0 && data._embedded && data._embedded.events) {
        console.log(artistName);
        const firstEvent = data._embedded.events[0];
        console.log('First Event:', firstEvent);

        //If the event is missing a field, we label it to N/A, except name

        const eventData = {
          email: USER_EMAIL,
          name: firstEvent.name,
          startTime: firstEvent.dates?.start?.dateTime || "N/A",
          city: firstEvent._embedded?.venues?.[0]?.city?.name || "N/A",
          venue: firstEvent._embedded?.venues?.[0]?.name || "N/A",
          url: firstEvent.url || "N/A",
        };
        console.log(eventData);

        fetch('/addevents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        })


      } else {
        console.log('No events found for this artist.');

      }
    })
    .catch(error => {
      console.error('Error fetching events:', error);
    });
}

function FrontTest_searchEvents() {
  const artistName = document.getElementById("artistName").value.toLowerCase();
  const url = `${TM_URL}/events.json?apikey=${TM_API_KEY}&keyword=${encodeURIComponent(artistName)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      //check for valid events (non-empty) in the data
      if (data.page.totalElements > 0) {
        console.log("Found event for: " + artistName);
        const firstEvent = data._embedded.events[0];
        console.log('First Event:', firstEvent);

        //If the event is missing a field, we label it to N/A, except name


        //setup db primary key: user's email for data:

        const eventData = {
          email: USER_EMAIL,
          name: firstEvent.name,
          startTime: firstEvent.dates?.start?.dateTime || "N/A",
          city: firstEvent._embedded?.venues?.[0]?.city?.name || "N/A",
          venue: firstEvent._embedded?.venues?.[0]?.name || "N/A",
          url: firstEvent.url || "N/A",
        };
        console.log(eventData);

        fetch('/addevents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        })

        setTimeout(() => { getEvents(); }, 1000);
      } else {
        console.log('No events found for this artist.');
      }
    })
    .catch(error => {
      console.error('Error fetching events:', error);
    });
}


function handleUserEmail() {
  if (this.status == 200) {
    var data = JSON.parse(this.responseText);
    //need to map data similarly to artist names above
    const email = data.email;
    console.log(email);
    //need function to display/format songs here
    USER_EMAIL = email;
  }
  else {
    console.log(this.responseText);
    alert(this.responseText);
  }

}

function getUserEmail() {
  const userUrl = "https://api.spotify.com/v1/me";

  callAPI("GET", userUrl, null, handleUserEmail);


}

function landingPage() {
  window.location.href = 'http://localhost:8080';
}


function getEvents() {
  console.log('trying to print events');
  fetch('/getevents')
    .then(response => response.json())
    .then(events => {
      const eventInfoSection = document.getElementById('eventInfoSection');
      eventInfoSection.innerHTML = '';

      events.forEach(event => {
        console.log('events', event)
        if (USER_EMAIL == event.email && event.url != "N/A") {
          const eventHTML = `
        <div class="event-item">
          <h2>${event.name}</h2>
          <p>Date: ${event.startTime}</p>
          <p>City: ${event.city}</p>
          <p>Venue: ${event.venue}</p>
          <p>URL: <a href="${event.url}" target="_blank">Ticketmaster Link</a></p>
        </div>
        `;
          eventInfoSection.innerHTML += eventHTML;
        }
      });
      console.log('Will delete these events now that processed displaying')
      deleteEvents(USER_EMAIL);
    })
}

function deleteEvents() {
  console.log('Trying to delete events for email:', USER_EMAIL);

  fetch(`/deleteevents/${USER_EMAIL}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (response.ok) {
        console.log('Deleted events associated with the email ' + USER_EMAIL);
      } else {
        console.error('Failed to delete events associated with the email ' + USER_EMAIL);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function clearDisplay() {
  const eventInfoSection = document.getElementById('eventInfoSection');
  eventInfoSection.innerHTML = '';
}

function buttonFade() {
  getArtists();

  const eventsButton = document.getElementById('eventsButton');
  eventsButton.style.display = 'none';
}
