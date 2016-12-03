var CLIENT_ID = '755016869544-m1o884uhradokkdrod2b7echive6isc0.apps.googleusercontent.com';

var SCOPES = ["https://www.googleapis.com/auth/calendar"];

/*
  Check if current user has authorized this application.
 */
function checkAuth() {
    gapi.auth.authorize({
        'client_id': CLIENT_ID,
        'scope': SCOPES.join(' '),
        'immediate': true
    }, handleAuthResult);
}

function sync() {
    synced = true;
    syncUploadDBEvents(); //to upload db events to Google Calendar
    renderDelay();
}

function syncUploadDBEvents() {
    $.each(events_by_id, function (id, event) {
        if (!event.synced) {
            var data = {
                name: event.name,
                location: event.location,
                start_datetime: event.start_datetime,
                end_datetime: event.end_datetime,
                allday: event.allday,
                description: event.description,
                eid: event.id,
                type: "add"
            };
            syncAddEditEvent(data,false);
            setSyncDB(event.id);
        }        
    });
}

var syncCount=0;

/*delay for sync before rendering*/
function renderDelay() {
    if(syncCount>0) {
        setTimeout(renderDelay,500);
        return;
    }
    
    render();
    syncCount=0;
}

/* in local db we notify the event has been synced*/
function setSyncDB(eid) {
    var url = "addsynced/"

    $.ajax({
        url: url,
        type: "POST",
        data: {
            eid: eid,
            csrfmiddlewaretoken: csrf
        },
        success: function (response) {
            console.log(response);
        }
    });
}

function syncEventsMonth() {
    var sdate = new Date(calgriddate.getTime());
    sdate.setDate(1);
    var edate = new Date(sdate.getTime());
    edate.setMonth(edate.getMonth() + 1);

    console.log("getting events from")
    console.log(sdate);
    console.log("to");
    console.log(edate);

    var request = gapi.client.calendar.events.list({
        "calendarId": "primary",
        "timeMin": sdate.toISOString(),
        "timeMax": edate.toISOString(),
        "timezone": "UTC",
        "showDeleted": false,
        'singleEvents': true,
        "orderBy": "updated"
    });

    request.execute(function (resp) {
        console.log(resp);
        var events = resp.items;

        if (events.length > 0) {
            events_by_id = [];

            for (i = 0; i < events.length; i++) {
                var event = events[i];

                var eid = event.id;
                var name = event.summary ? event.summary : "no-name";
                var location = event.location ? event.location : "no-location";
                var allday = false;
                var sdate = event.start.dateTime;
                if (!sdate) {
                    sdate = event.start.date;
                    allday = true;
                }

                var edate = event.end.dateTime;
                if (!edate) {
                    edate = event.end.date;
                    allday = true;
                }

                var description = event.description ? event.description : "no-description";

                events_by_id[eid] = {
                    id: eid,
                    name: name,
                    location: location,
                    start_datetime: sdate,
                    end_datetime: edate,
                    allday: allday,
                    description: description
                };

                addEventli(sdate, eid, name);
            }
        } else {
            console.log('No upcoming events found.');
        }
    });
}

function syncAddEditEvent(data,renderbool) {
    syncCount+=1;
    
    if(renderbool===undefined)
        renderbool=true;
    console.log("renderbool",renderbool);

    var event = {
        'summary': data.name,
        'location': data.location,
        'description': data.description,
        'start': {
            'dateTime': data.start_datetime,
            'timeZone': 'UTC'
        },
        'end': {
            'dateTime': data.end_datetime,
            'timeZone': 'UTC'
        }
    };

    if (data.allday) {
        delete event["start"]["dateTime"];
        event["start"]["date"] = getInputDate(new Date(data.start_datetime));

        delete event["end"]["dateTime"];
        event["end"]["date"] = getInputDate(new Date(data.end_datetime));
    }

    console.log(event);

    if (data.type == "add") {
        var request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        });
    } else if (data.type == "edit") {
        var request = gapi.client.calendar.events.update({
            'calendarId': 'primary',
            'eventId': data.eid,
            'resource': event
        });
    }

    request.execute(function (event) {
        console.log('Event created: ' + event.htmlLink);
        if(renderbool)
            render();
        closeModals();
        syncCount-=1;
    });
}


/*delete event when synced*/
function syncDelEvent(id) {
    var request = gapi.client.calendar.events.delete({
        'calendarId': "primary",
        'eventId': id
    });

    request.execute(function (resp) {
        console.log("DELETED");
        console.log(resp);
        render();
        closeModals();
    });
}


function handleAuthResult(authResult) {
  
    if (authResult && !authResult.error) {
      
        loadCalendarApi();
    } 
}

/*called on sync clic*/
function handleAuthClick(event) {
    gapi.auth.authorize({
            client_id: CLIENT_ID,
            scope: SCOPES,
            immediate: false
        },
        handleAuthResult);
    return false;
}


function loadCalendarApi() {
    gapi.client.load('calendar', 'v3', sync);
}
