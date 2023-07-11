document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1,
        aspectRatio: 2.2,
        handleWindowResize: true,
        headerToolbar: {
            start: 'title',
            center: '',
            end: 'today prevYear,prev,next,nextYear' // Add custom buttons for one year navigation
        },
        views: {
            dayGridMonth: {
                buttonText: 'Month',
                titleFormat: { year: 'numeric', month: 'long' },
                selectable: true,
                selectableHelper: true
            }
        },
        customButtons: {
            prevYear: {
                text: 'Prev Year',
                click: function() {
                    calendar.prevYear();
                }
            },
            nextYear: {
                text: 'Next Year',
                click: function() {
                    calendar.nextYear();
                }
            }
        },
        dateClick: function(info) {
            // Handle date click event
            openModal(info.dateStr);
        },
        eventClick: function(info) {
            // Handle event mouse enter
            showEventDetails(info.event);
        },
        events: eventListData(eventList),
        eventColor: '#2E424D'
        });

    // Event list passed from calendar.html which gets data from server.
    // Modifying the data so it fits the events property
    function eventListData(eventList) {
        var decodedData = eventList.replace(/&#39;/g,'"');
        var parser = new DOMParser();
        var doc = parser.parseFromString(decodedData,'text/html');
        var jsonString = doc.body.textContent;
        var parsedData = JSON.parse(jsonString);
        return parsedData;
    }

    // AJAX request for getting current user ID from server
    async function getUserID () {
        try {
            const response = await fetch('/get_user');
            if (response.ok) {
                const data = await response.json();
                if (data.status == "error") {
                    alert(data.message)
                } else {
                    return data.user_id;
                }
            } else {
                throw new Error("Request failed");
            }
        } catch (error) {
            console.log("Error message: " + error);
        }
    }

    // AJAX request for getting current user ID from server
    async function getEventOwnerID (eventID) {
        try {
            const response = await fetch('/event_owner_id',{
                method:"POST",
                body: JSON.stringify({event_id:eventID}),
                headers: {
                    "Content-Type":"application/json",
                    },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status=="success") {
                    let eventOwnerID = data.user_id;
                    return eventOwnerID;
                } else {
                    alert(data.message);
                }
            } else {
                throw new Error("Request failed");
            }
        } catch (error) {
            alert("Det oppstod en feil ved henting av event owner fra server");
        }
    }


    // Open Bootstrap modal with selected date
    function openModal(dateStr) {
        // Update modal content and show the modal
        var modal = document.getElementById('myModal');
        var modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = 
        `
        <form id="booking-form" action="/add_event" method="POST">
        <div class="form-group">
          <label for="booking-title">Title</label>
          <input type="text" class="form-control" id="booking-title" name="booking-title" placeholder="Enter the title" required>
        </div>
        <div class="form-group">
          <label for="booking-description">Description</label>
          <textarea class="form-control" id="booking-description" name="booking-description" rows="3" maxlength="300" placeholder="Enter the description" required></textarea>
        </div>
        <div class="booking date-picker">
          <p>From:</p>
          <input type="date" id="start-date-booking" name="booking-start" value="${dateStr}" required>
          <p>To:</p>
          <input type="date" id="end-date-booking" name="booking-end" value="${dateStr}" required>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn primary-btn">Legg til</button>
          <button type="button" class="btn secondary-btn" data-dismiss="modal">Lukk</button>
        </div>
        </form>
        `;
        var modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    // Show event details when an event is clicked
    async function showEventDetails(event) {
        try {
            // Retrieve the current user id from the server side. 
            // Will be used for restricting edit or delete of event
            const userID = await getUserID();
            
            // Retrieve the necessary event details
            var title = event.title;
            var start = event.start.toDateString();
            var end = event.end.toDateString();
            var eventID = event.id;
            const eventOwnerID = await getEventOwnerID(eventID);
            
            // bugs with fullCalendar date so need to modify the end date
            var endDateObject = new Date(end);
            endDateObject.setDate(endDateObject.getDate() -1 );
            updatedEndDate = endDateObject.toDateString();

            var description = event.extendedProps.description;
            var owner = event.extendedProps.owner;

            // Display the event details in a modal or any other element
            // Example: Bootstrap modal
            var modalTitle = document.getElementById('event-modal-title');
            var modalStart = document.getElementById('event-start');
            var modalEnd = document.getElementById('event-end');
            var modalDescription = document.getElementById("event-description");
            var modalOwner = document.getElementById('event-owner');
            var eventIdElement = document.getElementById('booking-event-id');

            modalTitle.textContent = title;
            modalStart.textContent = `${start}`;
            modalEnd.textContent = `${updatedEndDate}`;
            modalDescription.textContent = description;
            modalOwner.textContent = `${owner}`;
            eventIdElement.textContent = `${eventID}`;

            // Open the modal
            var modalEventDetails = new bootstrap.Modal(document.getElementById('event-modal'));
            modalEventDetails.show();

            // Add event listener to close event details button
            var closeEventButton = document.getElementById("close-event-details");
            closeEventButton.addEventListener('click', function() {
                // Close the modal
                modalEventDetails.hide();
            });

            // Restrict user from editing or deleting event
            if (userID == eventOwnerID || userID == 1) {
                
                // Show edit and delete button
                edit_event_button = document.getElementById("edit-booking-event");
                edit_event_button.classList.remove("hide-element");
                delete_event_button = document.getElementById("delete-booking-event");
                delete_event_button.classList.remove("hide-element");
                
                var editBookingButton = document.getElementById("edit-booking-event");
                editBookingButton.addEventListener('click', async function() {
                
                // Close the modal for event details
                modalEventDetails.hide();

                var modal = document.getElementById('myModal');
                var modalTitle = document.getElementById("exampleModalLongTitle");
                modalTitle.textContent = "Rediger booking detaljer";
                var modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();
                
                var modalBody = modal.querySelector('.modal-body');
                modalBody.innerHTML = 
                `
                <form id="booking-form" action="/edit_event" method="POST">
                <div class="form-group">
                <label for="booking-title">Title</label>
                <input type="text" class="form-control" id="booking-title" name="booking-title" placeholder="Enter the title" required>
                </div>
                <div class="form-group">
                <label for="booking-description">Description</label>
                <textarea class="form-control" id="booking-description" name="booking-description" rows="3" maxlength="300" placeholder="Enter the description" required></textarea>
                </div>
                <div class="booking date-picker">
                <p>From:</p>
                <input type="date" id="start-date-booking" name="booking-start" value="" required>
                <p>To:</p>
                <input type="date" id="end-date-booking" name="booking-end" value="" required>
                </div>
                <div class=form-group>
                <label for="eventid">Booking Event ID (låst)</label>
                <input type="text" class="form-control" id="event-id-update" name="eventid" required readonly>
                </div>
                <div class="modal-footer">
                <button type="submit" class="btn primary-btn">Oppdater</button>
                <button type="button" class="btn secondary-btn" data-dismiss="modal">Lukk</button>
                </div>
                </form>
                `;
                var eventTitle = document.getElementById("booking-title");
                eventTitle.value = title;
                var eventStart = document.getElementById("start-date-booking");
                eventStart.value = changeDateFormat(start);
                var eventEnd = document.getElementById("end-date-booking");
                eventEnd.value = changeDateFormat(updatedEndDate);
                var eventDescription = document.getElementById("booking-description");
                eventDescription.value = description;
                var eventID = document.getElementById("event-id-update");
                eventID.value = String(event.id);
            });
            } else {

                // Hide edit and delete button
                edit_event_button = document.getElementById("edit-booking-event");
                edit_event_button.classList.add("hide-element");
                delete_event_button = document.getElementById("delete-booking-event");
                delete_event_button.classList.add("hide-element");
            }
        } catch (error) {
            console.log("Error: " + error);
        }
    }
    calendar.render();
});

function changeDateFormat(dateString) {
    // takes a datestring as input
    var dateObj = new Date(dateString);
    var year = dateObj.getFullYear();
    var month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    var day = dateObj.getDate().toString().padStart(2, '0');
    var formattedDate = year + "-" + month + "-" + day;
    return formattedDate;
}

async function deleteEvent() {
    let bookingEventID = document.getElementById("booking-event-id").textContent;

    confirm_delete = confirm("Er du sikker på at du ønsker å slette denne eventen?")

    if (confirm_delete) {
        try {
            const response = await fetch("/delete_event", {
            method:"DELETE",
            body: JSON.stringify({event_id:bookingEventID}),
            headers: {
                "Content-Type":"application/json",
                },
            });
            if(response.ok) {
                console.log("Event deleted successfully!")
                data =  await response.json();
                if (data.status == "error") {
                    alert(data.message)
                } else {
                    window.location.reload();
                }
            }
        } catch (error) {
            console.log("There was an error deleting the event! Error message: " + error);
            alert("Det oppstod et problem ved henting av data fra server");
        }
    }
}