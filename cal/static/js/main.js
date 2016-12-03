var currdate = new Date(),
    calgriddate = new Date();

var $monthup = $("#month-up"),
    $monthdn = $("#month-dn"),
    $curr_month = $("#curr-month .month"),
    $curr_year = $("#curr-month .year"),
    $weekdays = $(".week-days th"),
    $save = $("#save"),
    $calendargrid = $("#calendar-grid");

var $thumb_month = $("#thumb .month"),
    $thumb_year = $("#thumb .year"),
    $thumb_calgrid = $("#cal-th-grid");

var events_by_id = {},
    synced = false;

/*sidebar time now*/
function now() {
    var time = new Date();
    h = time.getHours();
    if (h < 10) {

        h = "0" + h;
    }
    m = time.getMinutes();
    if (m < 10) {
        m = "0" + m;
    }
    ampm = h >= 12 ? 'pm' : 'am';

    document.getElementById("hr").innerHTML = h;
    document.getElementById("min").innerHTML = m;
    document.getElementById("ampm").innerHTML = ampm;
    setTimeout(now, 30000);
}

var month_grid = [];

/*add day to grid in calendar*/
function newday(date, classes) {
    var $td = $("<td>", {
        class: classes
    });

    var $dayno = $("<span>", {
        class: "day-cell-no"
    });
    $dayno.html(date.getDate())


    var $addevent = $("<span>", {
        class: "day-cell-add",
        "data-date": date.toUTCString()
    });
    $addevent.html("<i class='fa fa-plus'></i>");
    $addevent.click(function () {
        var date = $addevent.data("date");
        showAddEvent(date);
    });

    var $topdiv = $("<div class='wrapper-top'>");
    $topdiv.append($dayno);
    $topdiv.append($addevent);
    $td.append($topdiv);

    var $eventlist = $("<ul>", {
        class: "day-cell-list"
    });
    $td.append($eventlist);

    date.setDate(date.getDate() + 1);

    var height = ($(window).height() - 90) / 6;
    $wrapper = $("<div class='wrapper'></div>");
    $wrapper.height(height);

    return $td.wrapInner($wrapper);
}

/* add day to grid in thumbnail in side bar*/
function newday_th(date, classes) {
    var $td = $("<td>", {
        class: classes
    });

    var $dayno = $("<span>", {
        class: "day-cell-no"
    });
    $dayno.html(date.getDate())
    $td.append($dayno);

    date.setDate(date.getDate() + 1);
    return $td;
}

/*generate the calendar for the month*/
function generate_table(month, year) {
    $curr_month.text(calgriddate.toLocaleString("en-us", {
        month: "long"
    }));
    $curr_year.text(calgriddate.getFullYear());
    $(".week-row").remove();

    //js Date class month starts from 0
    var fd = new Date(year, month - 1, 1);
    var ld = new Date(year, month, 0);

    // select weekday
    $weekdays.removeClass("selected");
    if (fd.getTime() <= currdate.getTime() && currdate.getTime() <= ld.getTime())
        $weekdays.eq(currdate.getDay()).addClass("selected");

    var date = new Date(year, month - 1, 1);
    date.setDate(date.getDate() - fd.getDay());

    month_grid = [];
    var celli = 0;
    var fdcelli = fd.getDay();
    var ldcelli = fdcelli + ld.getDate() - 1;
    for (var r = 0; r < 6; ++r) {
        var $tr = $("<tr >", {
            class: 'week-row'
        });
        for (var d = 0; d < 7; ++d) {
            //when each day is being created
            // we need to check in JSON for events of this date
            if (celli < fdcelli) {
                $tr.append(newday(date, "day-cell not-present"));
            } else if (fdcelli <= celli && celli <= ldcelli) {

                var cls = "day-cell";
                if (date.toDateString() === currdate.toDateString())
                    cls += " curr";

                //console.log(date,currdate);
                console.log(cls);
                var $td = newday(date, cls)
                $tr.append($td);
                month_grid.push($td);
            } else {
                $tr.append(newday(date, "day-cell not-present"));
            }

            celli++;
        }
        $calendargrid.append($tr);
    }
}

/*generate thumnail calendar*/
function generate_thumb(month, year) {
    $thumb_month.text(calgriddate.toLocaleString("en-us", {
        month: "long"
    }));
    $thumb_year.text(calgriddate.getFullYear());
    $(".week-row-th").remove();

    //js Date class month starts from 0
    var fd = new Date(year, month - 1, 1);
    var ld = new Date(year, month, 0);

    var date = new Date(year, month - 1, 1);
    date.setDate(date.getDate() - fd.getDay());

    var celli = 0;
    var fdcelli = fd.getDay();
    var ldcelli = fdcelli + ld.getDate() - 1;
    while (celli < ldcelli) {
        var $tr = $("<tr>", {
            class: 'week-row-th'
        });
        for (var d = 0; d < 7; ++d) {
            if (celli < fdcelli) {
                $tr.append(newday_th(date, "day-cell-th not-present"));
            } else if (fdcelli <= celli && celli <= ldcelli) {
                var cls = "day-cell-th";
                if (date.getTime() === currdate.getTime())
                    cls += " curr";
                var $td = newday_th(date, cls)
                $tr.append($td);
                month_grid.push($td);
            } else {
                $tr.append(newday_th(date, "day-cell-th not-present"));
            }

            celli++;
        }
        $thumb_calgrid.append($tr);
    }
}

/*add events from db to page*/
function add_events(month, year, response) {
    console.log(response);
    if (response.success) {
        var events = response.data;
        
        events.forEach(function (event, i) {
            var s_date = new Date(event.start_datetime),
                e_date = new Date(event.end_datetime),
                event_name = event.name,
                h = s_date.getHours(),
                hstr = (h > 12 ? h - 12 : h) + (h >= 12 ? "p" : "a");
            events_by_id[event.id] = event;

            for (var it = s_date.getDate(); it <= e_date.getDate(); ++it) {
                addEventli(event.start_datetime, event.id, event.name);
            }
        });
    } else {
        console.log(response.message);
    }
}



/*add individual events*/
function addEventli(sdateiso, id, name) {
    var sdate = new Date(sdateiso),
        h = sdate.getHours(),
        hstr = (h > 12 ? h - 12 : h) + (h >= 12 ? "p" : "a"),
        dayno = sdate.getDate();

    var $li = $("<li>", {
        class: "day-cell-li",
        "data-event-id": id
    });
    $li.append($("<span class='event-name'>").html(name));
    $li.append($("<span class='event-time'>").html(hstr))

    $li.click(function () {
        var id = $(this).data("event-id");
        showEvent(id);
    })

    month_grid[dayno - 1]
        .find(".day-cell-list:first")
        .append($li);
}

$(".form-div").dialog({
    autoOpen: false,
    draggable: false,
    resizable: false,
    modal: true,
    minHeight: 450
});

function showAddEvent(date) {
    var date = new Date(date);
    var $form = $("#form-add-event");
    var curr = new Date();

    //set form values
    $form.find("#id_name").val("");
    $form.find("#id_location").val("");
    $form.find("#form-date").html(date.toDateString());
    $form.find("#add-event-sdate").val(getInputDate(date));
    $form.find("#add-event-stime").val(getInputTime(curr));
    $form.find("#add-event-edate").val(getInputDate(date));
    curr.setHours(curr.getHours() + 1);
    $form.find("#add-event-etime").val(getInputTime(curr));
    $form.find("#id_type").val("add");


    $form.dialog("open");
    closeOnOutsideClick();
    closeOnCancel();
}

function getInputDate(date) {
    var year = date.getFullYear(),
        month = date.toLocaleDateString("en-us", {
            month: "2-digit"
        }),
        day = date.toLocaleDateString("en-us", {
            day: "2-digit"
        }),
        str = year + "-" + month + "-" + day;
    return str;
}

function getInputTime(time) {
    var h = time.getHours(),
        hour = (h < 10 ? '0' + h : h),
        m = time.getMinutes(),
        min = (m < 10 ? '0' + m : m);
    console.log(hour + ":" + min);
    return hour + ":" + min;
}

function showEditForm(id) {
    var event = events_by_id[id];
    var $form = $("#form-add-event");

    console.log(event);

    $form.find("#id_name").val(event.name);
    $form.find("#id_location").val(event.location);
    var sdate = new Date(event.start_datetime);
    var edate = new Date(event.end_datetime);
    $form.find("#add-event-sdate").val(getInputDate(sdate));
    $form.find("#add-event-stime").val(getInputTime(sdate));
    $form.find("#add-event-edate").val(getInputDate(edate));
    $form.find("#add-event-etime").val(getInputTime(edate));

    $form.find("#id_allday").attr('checked', event.allday);
    $form.find("#id_desc").val(event.description);
    $form.find("#id_type").val("edit");
    $form.find("#id_eid").val(event.id);

    closeModals();
    $form.dialog("open");
    closeOnOutsideClick();
    closeOnCancel();
}

function showEvent(id) {
    var $form = $("#form-show-event");
    var event = events_by_id[id];

    //set form values
    $form.find("#form-show-name").html(event.name);
    $form.find("#form-show-location").html(event.location);
    $form.find("#form-show-date").html(new Date(event.start_datetime).toString());
    $form.find("#form-show-desc").html(event.description);

    var $btn_edit = $form.find("#btn-edit");
    $btn_edit.data("eid", event.id);
    $btn_edit.off("click");
    $btn_edit.click(function () {
        showEditForm($(this).data("eid"));
    });

    var $btn_delete = $form.find("#btn-delete");
    $btn_delete.data("id", event.id);
    $btn_delete.off("click");
    $btn_delete.click(function () {
        ajaxdelete($(this).data("id"));
    });

    $form.dialog("open");
    closeOnOutsideClick();
}

function disable($el) {
    $el.attr('disabled', 'disabled');
    return $el;
}

function enable($el) {
    $el.removeAttr("disabled");
    return $el;
}

function closeOnCancel() {
    $(".btn-cancel").off("click");
    $(".btn-cancel").click(function () {
        closeModals();
    });
}

function closeModals() {
    $(".form-div").dialog("close");
}

function closeOnOutsideClick() {
    $(".ui-widget-overlay").off("click");
    $(".ui-widget-overlay").click(function () {
        closeModals();
    });
}

function render(month, year) {
    console.log("rendering");
    month = month || (calgriddate.getMonth() + 1);
    year = year || calgriddate.getFullYear();

    generate_table(month, year);
    generate_thumb(month, year);

    if (synced) {
        syncEventsMonth();
    } else {
        ajax(month, year, function (response) {
            add_events(month, year, response);
        });
    }

    setCurrentWeather();
}

function setCurrentWeather() {
    var city;
    $.get("http://ipinfo.io", function (res) {
        city = res.city;

        weather_ajax(city, function (response) {
            console.log(response);

            $("#max-temp").html(response.list[0].main.temp_max.toString().split('.')[0] + "<sup>o</sup>");
            $("#min-temp").html(response.list[0].main.temp_max.toString().split('.')[0] + "<sup>o<sub>C</sub></sup>");
            var weather_id = response.list[0].weather[0].id
            $("#desc").html(response.list[0].weather[0].description.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            }));


            var ico = "fa-sun-o";

            if (weather_id > 800 && weather_id < 900)
                ico = "fa-cloud";
            else if (weather_id >= 200 && weather_id < 300)
                ico = "fa-bolt";
            $("#ico").html("<i class='fa " + ico + "'></i>");


            var dt = new Date();
/*Rendering forecast for next 4 days*/
            if (calgriddate.getMonth() == dt.getMonth()) {
                var index = parseInt(response.cnt / 5);

                for (var i = 1; i < 5; ++i) {
                    var weather_forecast = response.list[i * index];



                    var ico = "fa-sun-o";
                    weather_id = weather_forecast.main.id;
                    if (weather_id > 800 && weather_id < 900)
                        ico = "fa-cloud";
                    else if (weather_id >= 200 && weather_id < 300)
                        ico = "fa-bolt";

                    var $dayweather = $("<span class='day-weather'></span>");
                    var $dayweath_contents = $("<span class='dw-icon'><i class='fa " + ico + "'></i></span><span class='mx-tmp'>" + parseInt(weather_forecast.main.temp_max) + "<sup>o</sup></span>/<sub><span class='mn-tmp'>" +
                        parseInt(weather_forecast.main.temp_min) + "<sup>o</sup></span></sub>");
                    $dayweather.append($dayweath_contents);

                    month_grid[dt.getDate() - 1 + i]
                        .find('.wrapper-top:first')
                        .children()
                        .first()
                        .after($dayweather);
                }
            }


        });
    }, "jsonp");
}

$monthup.click(function () {
    calgriddate.setMonth(calgriddate.getMonth() - 1);
    render();
});
$monthdn.click(function () {
    calgriddate.setMonth(calgriddate.getMonth() + 1);
    render();
});

render();
now();

/*AJAX ACTIONS*/
function ajax(month, year, callback) {
    var url = "getevents/";
    url += month + "/" + year;
    $.ajax({
        type: "GET",
        url: url,
        success: function (response) {
            //console.log(response);
            callback(response);
        }
    });
}

function newevent(ev) {
    ev.preventDefault();

    var form = document.forms["add-event"],
        type = form.type.value,
        eid = form.eid.value,
        name = form.name.value.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}),
        location = form.location.value.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}),
        start_date = form.start_date.value,
        start_time = form.start_time.value,
        end_date = form.end_date.value,
        end_time = form.end_time.value,
        allday = form.allday.checked,
        description = form.description.value;

    var start_datetime = new Date(start_date + " " + start_time);
    var end_datetime = new Date(end_date + " " + end_time);

    if (start_datetime.getTime() > end_datetime.getTime()) {
        alert("Start Date is greater than End Date");
        return false;
    }

    var data = {
        name: name,
        location: location,
        start_datetime: start_datetime.toISOString(),
        end_datetime: end_datetime.toISOString(),
        allday: allday,
        description: description,
        csrfmiddlewaretoken: csrf,
        eid: eid,
        type: type
    };

    console.log(data);

    if (synced) {
        syncAddEditEvent(data);
    } else {
        var url = "addevent/";
        $.ajax({
            url: url,
            type: "POST",
            data: data,
            success: function (response) {
                console.log(response);
                console.log("success");
                render();
                closeModals();
            }
        });
    }

    return false;
}

function ajaxdelete(id) {
    if (synced) {
        syncDelEvent(id);
    } else {
        $.ajax({
            type: "DELETE",
            headers: {
                "X-CSRFToken": csrf
            },
            data: {
                eid: id
            },
            url: "/delevent",
            success: function (response) {
                console.log(response);
                if (response.success) {
                    render();
                    closeModals();
                }
            }
        });
    }
}

function weather_ajax(city, callback) {
    var apikey = "a0074aec13da73ca24ebb61211faceaa";
    var ur = "http://api.openweathermap.org/data/2.5/forecast?q=" + city + "&APPID=" + apikey + "&units=metric";
    $.ajax({
        type: "GET",
        url: ur,
        success: function (response) {
            callback(response);
        }
    });
}