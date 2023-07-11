
function constructTableFromPastedInput(event) {
    event.preventDefault();
    let pastedInput = event.clipboardData.getData('text/plain');
    let rawRows = pastedInput.split("\n");
    let headRow = '';
    let bodyRows = [];
    rawRows.forEach((rawRow, idx) => {
        let rawRowArray = rawRow.split("\t");
        if (idx == 0) {
            headRow = `<tr><th>${rawRowArray.join("</th><th>")}</th></tr>`;
        } else {
            bodyRows.push(`<tr><td>${rawRowArray.join("</td><td>")}</td></tr>`);
        }
    })
    let result = 
    `
        <table class="boostrap4_table_head_dark_striped_rounded_compact">
            <thead>
                ${headRow}
            </thead>
            <tbody>
                ${bodyRows.join("")}
            </tbody>
        </table>
    `;
    document.getElementById("table_container").innerHTML = result;
    return result
}

function constructJSONFromPastedInput(pastedInput) {
  let rawRows = pastedInput.split("\n");
  let headersArray = rawRows[0].split("\t");
  let output = []
  rawRows.forEach((rawRow, idx) => {
      if ( idx > 0 ) {
          let rowObject = {};
          let values = rawRow.split("\t");
          headersArray.forEach((header, idx) => {
              rowObject[header] = values[idx];
          });
          output.push(rowObject);
      }
  })
  return output;
}

function clearData() {
  document.getElementById("myDemoTextArea").value = "";
  document.getElementById("table_container").innerHTML = "";
  document.getElementById("table_container").style.display = "none";
  location.reload();
}

async function delete_blog_post(current_user_id,id) {

    var result = confirm("Are you sure you want to delete this post?");
    if (result) {
        document.getElementById("upload-post-spinner").style.display = "flex";
        try {
            let response = await fetch("/delete_post", {
            method: "DELETE",
            credentials: "include",
            body: JSON.stringify({post_id:id}),
            cache: "no-cache",
            headers: new Headers({
                "content-type": "application/json"
                })
            });
            console.log(window.origin);
            if (!response.ok) {
                document.getElementById("upload-post-spinner").style.display = "none";
                throw new Error("Network response was not ok");
            } else {
                document.getElementById("upload-post-spinner").style.display = "none";
                let year_div = document.getElementById("year-view-filter-list");
                let year_html = "";
                const dataResponse = await response.json();
                // Loop over JSON response and generate HTML
                let html = '';
                dataResponse.forEach( (row,index) => {

                    // First item contians list of years for filtering list post view
                    if (index===0) {
                        dataResponse[0].years.forEach(year => {
                            year_html += 
                            `
                            <button class="year" id="${year}" onclick="filterListOnYear(this)">${year}</button>
                            `
                        })
                        year_div.innerHTML = year_html;
                    // Loop all the posts and update innerhtml
                    } else {
                        view_post_url = window.origin + "/posts/" + row.id;
                        edit_post_url = window.origin + "/edit/" + row.id;
                        if (current_user_id == row.user_id || current_user_id==1) {
                            html += `
                            <article class="blog-post-element">
                                <div class="p-4 shadow-4 rounded-3 list-group-item-view-list">
                                    <div class="group-post-metadata">
                                        <h5><a href="${view_post_url}">${row.blog_title}</a></h5>
                                        <p class="from-date-post-list-posts">Fra: ${row.fromDate}</p>
                                        <p class="to-date-post-list-posts">Til: ${row.toDate}</p>
                                        <p class="added-post-by">Lagt til av: ${row.firstname} ${row.lastname}</p>
                                    </div>
                                    <div class="group-post-buttons">
                                        <a class="edit_post_${row.id}" href="${edit_post_url}"><img class="small-view-icon" src="../static/images/edit.png" alt="view"></a>
                                        <a class="delete_post_${row.id}" href="#" onclick="delete_blog_post('${current_user_id}','${row.id}')"><img class="small-view-icon" src="../static/images/trash-icon.png" alt="view"></a>
                                    </div>
                                </div>
                            </article>
                            `;
                        } else {
                            html += `
                            <article class="blog-post-element">
                                <div class="p-4 shadow-4 rounded-3 list-group-item-view-list">
                                    <div class="group-post-metadata">
                                        <h5><a href="${view_post_url}">Title: ${row.blog_title}</a></h5>
                                        <p class="from-date-post-list-posts">From: ${row.fromDate}</p>
                                        <p class="to-date-post-list-posts">To: ${row.toDate}</p>
                                        <p class="added-post-by">Added By: ${row.firstname} ${row.lastname}</p>
                                    </div>
                                </div>
                            </article>
                            `;
                        }
                    }
                });
                // Replace the HTML content
                var newUrl =  window.location.href.replace("#","");
                history.replaceState({path:newUrl},'',newUrl);                
                //console.log(html);
                document.getElementById('list-blog-posts-view').innerHTML = html;
            }
        }
        catch(error) {
            document.getElementById("upload-post-spinner").style.display = "none";
            console.log("ERROR MESSAGE: " + error);
        }
    } else {
        console.log("Cancel was clicked!");
    }
}

function filterPostsList() {
    let posts = document.querySelectorAll('.blog-post-element');
    let search_text = document.getElementById('my-search-text').value;

    for (let i=0; i < posts.length; i++) {
        if (posts[i].innerText.toLowerCase().includes(search_text.toLowerCase())) {
            posts[i].classList.remove("hide-element");
        } else {
            posts[i].classList.add("hide-element");
        }
    }
    console.log("Search Text: " + search_text);
}

async function filterListOnYear(year) {
    document.getElementById('my-search-text').value="";

    let year_filter = "";

    if (year.id == "Alle") {
        year_filter = 0;
    } else {
        year_filter = year.id;
    }

    var url = window.location.origin + "/posts/";

    endpoint = `/view_list/${year.id}`;

    console.log("End point: " + endpoint);

    try {
        let response = await fetch(endpoint,{
            method: "GET",
            cache: "no-cache",
            headers: new Headers({
                "content-type": "application/json"
                })
            });
        if (response.ok) {
            const responseData = await response.json();
            let html = "";
            responseData.forEach(row => {
                if (row["current_user_id"]==row["user_id"] || row["current_user_id"] == 1) {
                    html += 
                    `
                    <article class="blog-post-element">
                        <div class="p-4 shadow-4 rounded-3 list-group-item-view-list">
                            <div class="group-post-metadata">
                                <h5><a href="${url}/${row["id"]}">${row["blog_title"]}</a></h5>
                                <p class="from-date-post-list-posts">Fra: ${row["fromDate"]}</p>
                                <p class="to-date-post-list-posts">Til: ${row["toDate"]}</p>
                                <p class="added-post-by">Lagt til av: ${row["firstname"]} ${row["lastname"]}</p>
                            </div>
                            <div class="group-post-buttons">
                                <a class="edit-post-button-view" href="${url}/${row["id"]}"><img class="small-view-icon" src="../static/images/edit.png" alt="view"></a>
                                <a class="delete-post-button-view" href="#" onclick="delete_blog_post( '${row["current_user_id"]}','${row["id"]}')"><img class="small-view-icon" src="../static/images/trash-icon.png" alt="view"></a>
                            </div>
                        </div>
                    </article>
                    `
                } else {
                    html += 
                    `
                    <article class="blog-post-element">
                        <div class="p-4 shadow-4 rounded-3 list-group-item-view-list">
                            <div class="group-post-metadata">
                                <h5><a href="${url}${row["id"]}">${row["blog_title"]}</a></h5>
                                <p class="from-date-post-list-posts">Fra: ${row["fromDate"]}</p>
                                <p class="to-date-post-list-posts">Til: ${row["toDate"]}</p>
                                <p class="added-post-by">Lagt til av: ${row["firstname"]} ${row["lastname"]}</p>
                            </div>
                        </div>
                    </article>
                    `
                }
            });
            document.getElementById('list-blog-posts-view').innerHTML = html;
        }
    } catch(error) {
        console.log("ERROR MESSAGE: " + error);
    }

}

function showFullImg(image) {
    var fullImgBox = document.getElementById("fullImgBox");
    var fullImg = document.getElementById("fullImg");

    fullImgBox.style.display = "flex";
    fullImg.src = upscaleImages(image.src);
    fullImg.classList.add(image.id)
    console.log("Img ID: " + image.id)
    document.body.style.overflow = "hidden";
}

function closeImage() {
    var fullImgBox = document.getElementById("fullImgBox");
    fullImgBox.style.display="none";
    fullImg.className = "";
    document.body.style.overflow = "auto";
}

function nextPopOutImage() {

    var fullImg = document.getElementById("fullImg");

    var list_images = document.querySelectorAll('.image-gallery-container-outer img');
    let list_images_data = [];

    for (let i=0; i<list_images.length;i++) {
        let image_object = {
            image_id: list_images[i].id,
            image_src: upscaleImages(list_images[i].src)
        };
        list_images_data.push(image_object);
    }

    let indexPosition = '';

    // loop to find the index position of the current image
    for (var x=0; x<list_images_data.length;x++) {
        if ((list_images_data[x].image_id) == fullImg.getAttribute("class")) {
            indexPosition = x.toString();
            break;
        }
    }

    // When next button clicked the next image in the list should be shown
    if (x+2 > list_images_data.length) {
        console.log("This is the last image in the gallery.");
    } else {
        fullImg.src = list_images_data[x+1].image_src;
        fullImg.className = list_images_data[x+1].image_id;     
    }
}

function prevPopOutImage() {
    console.log("Prev Button Clicked");

    var fullImg = document.getElementById("fullImg");

    var list_images = document.querySelectorAll('.image-gallery-container-outer img');
    let list_images_data = [];

    for (let i=0; i<list_images.length;i++) {
        let image_object = {
            image_id: list_images[i].id,
            image_src: upscaleImages(list_images[i].src)
        };
        list_images_data.push(image_object);
    }

    let indexPosition = '';

    // loop to find the index position of the current image
    for (var x=0; x<list_images_data.length;x++) {
        if ((list_images_data[x].image_id) == fullImg.getAttribute("class")) {
            indexPosition = x.toString();
            break;
        }
    }

    // When next button clicked the next image in the list should be shown
    if (x==0) {
        console.log("This is first image in the gallery");
    } else {
        fullImg.src = list_images_data[x-1].image_src;
        fullImg.className = list_images_data[x-1].image_id;     
    }
}

function upscaleImages(url) {
    var transformedURL = url.replace('https://ik.imagekit.io/hts792344/lussevika145/tr:h-350,w-350/','https://ik.imagekit.io/hts792344/lussevika145/tr:q-40/');
    console.log(transformedURL)
    return transformedURL;
  }

async function addPostForm(event) {
    event.preventDefault();
    document.getElementById("upload-post-spinner").style.display = "flex";

    try {
        var list_uploaded_images = await uploadImages("upload_image");
        console.log(JSON.stringify(list_uploaded_images));
    } catch(error) {
        console.log(error);
    }
    var formData = new FormData(document.getElementById("upload-post-form"));

    var form_data = {
        blogTitle : formData.get("blogtitle"),
        fromDate : formData.get('fromDate'),
        toDate : formData.get('toDate'),
        blogContent : formData.get('blogcontent'),
        images : list_uploaded_images
    }

    console.log(JSON.stringify(form_data));

    try{
        const response = await fetch("/addpost", {
            method:"POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify(form_data)
        });
        if (response.ok) {
            data = await response.json();
            console.log(data);
            if (data.status == "success") {
                document.getElementById("upload-post-spinner").style.display = "none"; 
                window.location.href = "/view"; 
            } else if (data.message == "From date needs to be before end date") {
                document.getElementById("upload-post-spinner").style.display = "none";
                alert("Fra dato kan ikke være etter sluttdato");
            } else if (data.message == "Title must have some text"){
                document.getElementById("upload-post-spinner").style.display = "none";
                alert("Tittel kan ikke være tom");
            } else if (data.message == "Blog content must have some text") {
                document.getElementById("upload-post-spinner").style.display = "none";
                alert("Hovedinnlegget kan ikke være tomt"); 
            } else if (data.message == "Both date needs to be filled out") {
                document.getElementById("upload-post-spinner").style.display = "none";
                alert("Vennligst fyll in både fra og til dato");
            } else if (data.message == "Upload to ImageKit failed"){
                document.getElementById("upload-post-spinner").style.display = "none";
                alert("Opplasting av bildet til ImageKit feilet. Error message: " + data.error_message);
            }
        } else {
            document.getElementById("upload-post-spinner").style.display = "none";
            alert("Det oppstod et problem ved håndtering av response fra server");
        }
    } catch(error) {
        document.getElementById("upload-post-spinner").style.display = "none";
        alert("Det oppstod et problem ved henting av data fra server")
    }
}

async function editWorkoutForm(event,id) {
    event.preventDefault();
    document.getElementById("upload-post-spinner").style.display = "flex";

    document.getElementById("edit-alert-message-container").innerHTML =
    `
        <div class="alert alert-danger alert-dismissible" id="edit-post-danger-message" style="display: none;">
            <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
            <strong>Error!</strong> Det skjedde en feil ved oppdatering av treningsøkten.
        </div>
    `
    try{
        const response = await fetch("/edit_workout/"+id, {
            method:"POST",
            body: new FormData(document.getElementById("upload-edit-workout-form"))
        });
        if (response.ok) {
            document.getElementById("upload-post-spinner").style.display = "none";
            const responseData = await response.json();
            if (responseData.status == "error") {
                alert(responseData.message);
            } else {
                alert(responseData.message);
                window.location.href = "/workouts"   
            }
        } else {
            alert("An error occured while updating the workout!")
        }
    } 
    catch(error) {
        document.getElementById("upload-post-spinner").style.display = "none";
        document.getElementById("edit-post-danger-message").style.display = "block";
        console.log("Error Message: " + error);
    }
}


async function editPostForm(event,id) {
    event.preventDefault();
    document.getElementById("upload-post-spinner").style.display = "flex";

    var inputFieldId = "upload_image";

    document.getElementById("edit-alert-message-container").innerHTML =
    `
        <div class="alert alert-success alert-dismissible" id="edit-post-success-message" style="display: none;">
            <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
            <strong>Suksess!</strong> Du har nå oppdatert innlegget.
        </div>
        <div class="alert alert-danger alert-dismissible" id="edit-post-danger-message" style="display: none;">
            <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
            <strong>Error!</strong> Det skjedde en feil ved oppdatering av innlegget.
        </div>
    `

    try {
        var list_uploaded_images = await uploadImages(inputFieldId);
        console.log(JSON.stringify(list_uploaded_images));
    } catch(error) {
        console.log(error);
    }

    var formData = new FormData(document.getElementById("upload-post-form"));

    var form_data = {
        blogTitle : formData.get("blogtitle"),
        fromDate : formData.get('fromDate'),
        toDate : formData.get('toDate'),
        blogContent : formData.get('blogcontent'),
        images : list_uploaded_images
    }

    try{
        const response = await fetch("/edit/"+id, {
            method:"POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify(form_data)
        });
        if (response.ok) {
            const responseData = await response.json();
            if (responseData.status == "error") {
                document.getElementById("upload-post-spinner").style.display = "none";
                alert(responseData.message)
            }
            let updated_gallery = "";
            responseData.forEach(item =>{
                tranformed_url = addTransformationToURL(item.url);
                updated_gallery += 
                    `
                    <div class="edit-single-image-container">
                        <img class="edit-single-blogpost-image" src="${tranformed_url}" alt="blog-post-image"></img>
                        <span class="delete-uploaded-post-image" id="${item.file_id}_${item.img_id}" onclick="deleteImage(this,${item.post_id})">&times;</span>
                    </div>
                    `;
            })
            document.getElementById("edit-post-image-gallery").innerHTML = updated_gallery;
            document.getElementById("upload-post-spinner").style.display = "none";
            document.getElementById("edit-post-success-message").style.display = "block";
        } else {
            document.getElementById("upload-post-spinner").style.display = "none";
            document.getElementById("edit-post-danger-message").style.display = "block";
        }
    } catch(error) {
        document.getElementById("upload-post-spinner").style.display = "none";
        document.getElementById("edit-post-danger-message").style.display = "block";
    }
}

function addTransformationToURL(url) {
    var transformedURL = url.replace('https://ik.imagekit.io/hts792344/Okslevegen_11/', 'https://ik.imagekit.io/hts792344/Okslevegen_11/tr:h-350,w-350/');
    return transformedURL;
  }

async function deleteImage(item,post_id) {

    try {
        document.getElementById("edit-post-success-message").style.display = "none";
    } catch(error) {
        console.log("Script continues");
    }

    try {
        document.getElementById("edit-post-danger-message").style.display = "none";
    } catch(error) {
        console.log("Script continues");
    }

    var result = confirm("Er du sikker på at du vil slette dette bildet?");
    if (result) {
        document.getElementById("upload-post-spinner").style.display = "flex";

        split_id = item.id.split("_");
        file_id = split_id[0];
        image_id = split_id[1];

        try {
            const response = await fetch("/delete_image", {
                method:"DELETE",
                body: JSON.stringify({file_id:file_id,image_id:image_id,post_id:post_id}),
                headers: {
                    "Content-Type":"application/json",
                },
            });
            if (response.ok) {
                const responseData = await response.json();
                if (responseData.status=="error") {
                    document.getElementById("upload-post-spinner").style.display = "none";
                    alert(responseData.message);
                }
                let updated_gallery = "";
                responseData.forEach(item =>{
                    if (item.images == 0) {
                        updated_gallery += "";
                    } else {
                        tranformed_url = addTransformationToURL(item.url);
                        updated_gallery += 
                        `
                        <div class="edit-single-image-container">
                            <img class="edit-single-blogpost-image" src="${tranformed_url}" alt="blog-post-image"></img>
                            <span class="delete-uploaded-post-image" id="${item.file_id}_${item.img_id}" onclick="deleteImage(this,${item.post_id})">&times;</span>
                        </div>
                        `;
                    }
                })
                document.getElementById("edit-post-image-gallery").innerHTML = updated_gallery;
                document.getElementById("upload-post-spinner").style.display = "none"; 
                console.log("Upload was successfull")
            } else {
                document.getElementById("upload-post-spinner").style.display = "none";
            }
        } 
        catch(error) {
            document.getElementById("upload-post-spinner").style.display = "none";
        }
    }
}

async function deleteCurrentWorkout(workout_id) {
    var result = confirm("Er du sikker på du ønsker å slette denne treningsøkten?");
    if (result) {
        document.getElementById("upload-post-spinner").style.display = "flex";
        try {
            const response = await fetch("/delete_workout", {
                method:"DELETE",
                body: JSON.stringify({workoutID:workout_id}),
                headers: {
                    "Content-Type":"application/json",
                },
            });
            if (response.ok) {
                document.getElementById("upload-post-spinner").style.display = "none";
                let responseData = await response.json();
                if (responseData.status == "error") {
                    alert(responseData.message);
                } else {
                    window.location.href="/workouts"
                }
            } else {
                alert("An error occured on the server side while trying to delete the workout");
            }
        }
        catch (error) {
            console.log("Error Message: " + error);
        }
    }
}

async function deletePost(post_id) {

    var result = confirm("Er du sikker på du ønsker å slette dette innlegget?");
    if (result) {
        document.getElementById("upload-post-spinner").style.display = "flex";
        try {
            const response = await fetch("/delete_post", {
                method:"DELETE",
                body: JSON.stringify({post_id:post_id}),
                headers: {
                    "Content-Type":"application/json",
                },
            });
            if (response.ok) {
                let responseData = await response.json();
                if (responseData.status=="error") {
                    document.getElementById("upload-post-spinner").style.display = "none";
                    alert(responseData.message);
                }
                document.getElementById("upload-post-spinner").style.display = "none";
                window.location.href="/view"
            } 
        }
        catch (error) {
            console.log("Error Message: " + error);
        }
    }
}

async function deleteWorkout(current_user,workout_id) {

    var result = confirm("Er du sikker på du ønsker å slette denne treningsøkten?");
    if (result) {
        document.getElementById("upload-post-spinner").style.display = "flex";
        try {
            const response = await fetch("/delete_workout", {
                method:"DELETE",
                body: JSON.stringify({workoutID:workout_id}),
                headers: {
                    "Content-Type":"application/json",
                },
            });
            if (response.ok) {
                let responseData = await response.json();
                document.getElementById("upload-post-spinner").style.display = "none";
                if (responseData.status == "error") {
                    alert(responseData.message);
                } else {
                    let html = ""
                responseData.forEach(row => {
                    workout_title_url = window.origin + "/workout/" + row.id;
                    workout_edit_url = window.origin + "/edit_workout/" + row.id;
                    if (current_user==row.owner_id || current_user == 1) {
                        html += 
                        `
                        <article class="blog-post-element">
                            <div class="p-4 shadow-4 rounded-3 list-group-item-view-list">
                                <div class="group-post-metadata">
                                    <h5><a href="${workout_title_url}">${row.name}</a></h5>
                                    <p class="from-date-post-list-posts">Tid: ${row.time}</p>
                                    <p class="to-date-post-list-posts">Sted: ${row.sted}</p>
                                    <p class="workout-category">Kategori: ${row.category_id}</p>
                                    <p class="workout-subcategory">Fokusområdet: ${row.sub_category_id}</p>
                                </div>
                                <div class="group-post-buttons">
                                    <a class="edit-post-button-view" href="${workout_edit_url}"><img class="small-view-icon" src="../static/images/edit.png" alt="view"></a>
                                    <a class="delete-post-button-view" href="#" onclick="deleteWorkout( '${row.current_user_id}','${row.id}')"><img class="small-view-icon" src="../static/images/trash-icon.png" alt="view"></a>
                                </div>
                            </div>
                        </article>
                        `
                    } else {
                        html +=
                        `
                        <article class="blog-post-element">
                            <div class="p-4 shadow-4 rounded-3 list-group-item-view-list">
                                <div class="group-post-metadata">
                                    <h5><a href="${workout_title_url}">${row.name}</a></h5>
                                    <p class="from-date-post-list-posts">Tid: ${row.time}</p>
                                    <p class="to-date-post-list-posts">Sted: ${row.sted}</p>
                                    <p class="workout-category">Kategori: ${row.category_id}</p>
                                    <p class="workout-subcategory">Fokusområdet: ${row.sub_category_id}</p>
                                </div>
                            </div>
                        </article>
                        `
                    }
                    // replace html content
                    document.getElementById('list-blog-posts-view').innerHTML = html;
                    });
                }
            } else {
                alert("An error occured while fetching the data from the database")
            }
        } catch (error) {
            console.log("Error Message: " + error);
        }
    }
}

async function deleteUser(firstname,lastname,user_id) {

    var result = confirm(`Er du sikker på at du ønsker å slette: ${firstname} ${lastname}?`);
    console.log("user-id: " + user_id)
    if (result) {
        if (user_id==1) {
            alert("Du prøver nå å slette admin. Dette er ikke mulig.");
        } else {
            let data = {
                "id": user_id,
            };
            try {
                let response = await fetch("/delete_item", {
                method: "DELETE",
                body: JSON.stringify(data),
                headers: new Headers({
                    "content-type": "application/json"
                    })
                })
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                let dataResponse = await response.json();
                if (dataResponse.status == "error" ) {
                    alert(dataResponse.message);
                } else {
                    // Loop over the JSON data and generate HTML for each row
                    let html = '';
                    dataResponse.forEach(row => {
                        html += 
                        `
                        <article class="user-container">
                            <div class="p-4 shadow-4 rounded-3 user-data-container">
                                <div class="group-user-data">
                                    <div class="user-data">
                                        <p class="user-id-content">${row.Id}</p>
                                    </div>
                                    <div class="user-data">
                                        <p class="user-name-content">${row.FirstName} ${row.LastName}</p>
                                    </div>
                                    <div class="user-data">
                                        <p class="user-email-content">${row.Email}</p>
                                    </div>
                                    <div class="delete-user-button-container user-data">
                                        <button class="delete-user-button" id="delete_user_${row.Id}" onclick="deleteUser('${row.FirstName}','${row.LastName}','${row.Id}')"><img class="small-delete-icon" src="../static/images/trash-icon.png" alt="deleteitem"></button>
                                    </div>
                                </div>
                            </div>
                        </article>
                        `;
                });
                // Set the HTML of the table body to the generated HTML
                document.getElementById('user-container-content').innerHTML = html;
                }                
            } catch(error) {
                console.log("ERROR Message: " + error);
            }   
        }
    }
}

function closeAlertMessage() {

    console.log("Pressed close alert message");

    let close_button = document.getElementsByClassName("alert-login-error");
    for (let i=0; i < close_button.length; i++) {
        close_button[i].style.display = "none";
    }
}

function validationCheck(event) {

    isFirstNameValid = firstNameCheck();
    isLastNameValid = lastNameCheck();
    isEmailValid = emailCheck();
    isPasswordValid = passwordCheck();
    passwordMatch = confirmPasswordCheck();

    console.log(isFirstNameValid);
    console.log(isLastNameValid);
    console.log(isEmailValid);
    console.log(isPasswordValid);
    console.log(passwordMatch);

    let alert_container = document.getElementById("error-message-container");
    let alert_message_container = document.getElementById("error-message");

    if (!isFirstNameValid && !isLastNameValid && !isEmailValid && !isPasswordValid && !passwordMatch) {
        alert_container.style.display = "block";
        alert_message_container.innerHTML = "Vennligst fyll ut alle feltene under!";
    } else if (!isFirstNameValid) {
        alert_container.style.display = "block";
        alert_message_container.innerHTML = "Vennligst fyll inn fornavn";
    } else if (!isLastNameValid) {
        alert_container.style.display = "block";
        alert_message_container.innerHTML = "Vennligst fyll inn etternavn";
    } else if (!isEmailValid) {
        alert_container.style.display = "block";
        alert_message_container.innerHTML = "Email er ikke gyldig! Prøv igjen.";
    } else if (!isPasswordValid) {
        alert_container.style.display = "block";
        alert_message_container.innerHTML = "Passordet må være minst 8 tegn langt og inneholde minst én liten bokstav, én stor bokstav og ett tall.";
    } else if (!passwordMatch) {
        alert_container.style.display = "block";
        alert_message_container.innerHTML = "Sørg for at passordene matcher!";
    } else {
    }

    if((!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPasswordValid || !passwordMatch)){
        event.preventDefault();
        return false
    } else {
        return true
    }

}

function hildeAlertKeyStroke() {
    const inputFields = document.querySelectorAll(".form-register-user");
    let alert_container = document.getElementById("error-message-container");
    inputFields.forEach(function(inputField) {
        let alert_container_diplay = window.getComputedStyle(alert_container).getPropertyValue("display");
            if (alert_container_diplay === "block") {
                document.getElementById("error-message-container").style.display = "none";
            }
        });    
}

function hideAlert() {
    let alert_container = document.getElementById("error-message-container");
    alert_container.style.display = "none";
}

function firstNameCheck() {
    let firstname = document.getElementById("inputFirstNamel3").value;
    if (firstname.length > 0) {
        return true;
    } else {
        return false;
    }
}

function lastNameCheck() {
    let lastname = document.getElementById("inputLastNamel3").value;
    if (lastname.length > 0) {
        return true;
    } else {
        return false;
    }
}

function emailCheck(){
    let email = document.getElementById("inputEmaill3").value;
    let regex_check = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (regex_check.test(email)){
        return true;
    } else {
        return false
    }
}

function passwordCheck() {
    let password = document.getElementById("inputPassword3").value;
    let regex_check = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if(regex_check.test(password)) {
        return true;
    } else {
        return false;
    }
}

function confirmPasswordCheck() {
    let password = document.getElementById("inputPassword3").value;
    let password_confirm = document.getElementById("inputConfirmPassword3").value;
    if (password.length > 0 && password_confirm.length > 0) {
        if(password == password_confirm) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function filterWorkouts() {
    let selectedCategoryElement = document.getElementById("filter-on-category-options");
    let selectedSubcategoryElement = document.getElementById("filter-on-subcategory-options");

    setCatgoryFilter(selectedCategoryElement.value);
    setSubCatgoryFilter(selectedSubcategoryElement.value);

    let selectedCategoryText = selectedCategoryElement.options[selectedCategoryElement.selectedIndex].innerText.trim();
    let selectedSubcategoryText = selectedSubcategoryElement.options[selectedSubcategoryElement.selectedIndex].innerText.trim();

    let search_text = document.getElementById('my-search-text').value;

    let posts = document.querySelectorAll('.blog-post-element');

    for (let i = 0; i < posts.length; i++) {
        let post = posts[i];
        let postCategory = post.querySelector(".workout-category").innerText;
        let postSubcategory = post.querySelector(".workout-subcategory").innerText;
    
        if ((selectedCategoryText === "Alle" || postCategory.toLowerCase().includes(selectedCategoryText.toLowerCase())) && (selectedSubcategoryText === "Alle" || postSubcategory.toLowerCase().includes(selectedSubcategoryText.toLowerCase()))) {
          post.classList.remove("hide-element");
        } else {
          post.classList.add("hide-element");
        }
      }

      let updatedPostsList = document.querySelectorAll('.blog-post-element:not(.hide-element)')

      for (let i=0; i < updatedPostsList.length; i++) {
        if (updatedPostsList[i].innerText.toLowerCase().includes(search_text.toLowerCase())) {
            updatedPostsList[i].classList.remove("hide-element");
        } else {
            updatedPostsList[i].classList.add("hide-element");
        }
    }
}

function setCatgoryFilter(value) {
    document.cookie = `categoryFilter=${value}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
}

function setSubCatgoryFilter(value) {
    document.cookie = `subcategoryFilter=${value}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
}

function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split("=");
      const cookieName = decodeURIComponent(cookie[0]);
      if (cookieName === name) {
        return decodeURIComponent(cookie[1]);
      }
    }
    return null;
  }

// Upload function internally uses the ImageKit.io javascript SDK
async function uploadImages(attributeId) {
    var fileInput = document.getElementById(attributeId);
    var files = fileInput.files;
    var uploadedCount = 0;

    list_uploaded_images=[];

    var progressText = document.getElementById("progress-circle-text");

    if (files.length >= 1) {

        async function uploadFile(file) {

            var imagekit = new ImageKit({
                publicKey : "public_1+etL/esvZQB92BtXRpMoYkLf6s=",
                urlEndpoint : "https://ik.imagekit.io/hts792344",
                authenticationEndpoint : "https://www.lussevika145.com/auth"
            });
    
            try {
                const result = await new Promise((resolve,reject) => {
                    imagekit.upload(
                        {
                            file : file,
                            fileName : file.name,
                            folder : 'lussevika145'
                        },
                        (err,result) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                });
                uploadedCount++;
                return {
                    url: imagekit.url({
                        src: result.url
                    }),
                    fileId: result.fileId
                }
            } catch (err) {
                console.log(err);
            }
        }

        
        // Calculate the progress percentage
        function calculateProgress() {
            return Math.floor((uploadedCount / files.length) * 100);
        }

        function updateProgressCircle() {
            var progress = calculateProgress();
            progressText.textContent = progress + " %";
        }
        

        for (var i = 0; i < files.length; i++) {
            let upload_result = await uploadFile(files[i]);
            if (upload_result) {
                list_uploaded_images.push(upload_result);
            }
            updateProgressCircle();
        }
        return list_uploaded_images;

    } else {
        console.log("No images selected");
        return list_uploaded_images
    }
  }