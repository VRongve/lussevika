

# DAT310 - Exam Project - Digital Hyttebok

## Presentation
___

I have uploaded a 5 minute video on Vimeo where I do a walkthrough of the website as requested. 
You can find the video by using the follwoing link: [DAT310 Exam - Presentation](https://vimeo.com/833804918?share=copy)
___

## Introduction
___
For the DAT310 exam, I have created a "digital hyttebok" (cabin logbook) where guests of the cabin can register and upload posts about their stay, along with accompanying images.

The home page always displays the latest post added to the database, as well as a weather forecast for the cabin's location.

The website currently allows new users to register and gain access. Users can view all posts added, but they can only edit or delete their own posts.

Additionally, I have included a functionality to post workouts. This way, we can build a database of workouts that we can search through when we want to exercise. The filters applied by the user are stored in cookies, so the next time the user visits the site, the workout list is pre-filtered based on their previous selections.

Another useful feature I have implemented is the ability to check the availability of the cabin. Users can plan their future stays by adding events that can span multiple days. This makes it easy to see when people are planning to stay at the cabin or not.

To facilitate administrative tasks, I have created an admin account with the email admin@gmail.com. This account has full editing and deletion rights within the application. 

The application is mainly storing data in a sqlite database. Images are stored on Imagekit.io and the url reference is stored in sqlite.
I'm using bootstrap and vanilla javascript. The website is responsive and should scale down to 375px.
___

## Setup
___

To add dummy data to the database or add the admin user, you can run the setupdatabase.py file. Note that you should only run this file if the SQLite database file is not already present.

I have also added a requriements.txt file which consist some packages that needed to be installed for the imagekitoi API to work.

To log in as an admin, you can use the following credentials:

* Email: admin@gmail.com
* Password: 3fsafs2eqa

DATABASE:
I have change the database from sqlite to postgresql, and i have no deployed my website to Heroku.
I can use pgAdmin4 to manage the database.
___
## Functionallity

* Color Palett
   * I have implemented the following color palette for my website:
      * #2E424D
      * #5B8291
      * #98DAD9
      * #EAEBED

* Admin
   * Access to the list of users (list_users.html) is restricted to the admin. The admin can delete users from the list, and when a user is deleted, their posts, booking events, and workouts associated with that user are automatically transferred to the admin.

* Styling
   * I have used Flexbox and Grid for layout purposes. For example, I used display grid in the landing page (index.html) to structure the content, and position (absolute/relative) for elements like the delete image button on edit_post.html.

* Validation
   * Client-side validation is performed during user registration to ensure that fields are not empty, the email is valid, and the password meets the requirements (minimum 8 characters with at least one lowercase letter, one uppercase letter, and one number).
   * Server-side validation is carried out during login to check if the email already exists and if the password matches.

* Autentication
   * The application keeps track of the logged-in user. Each user is only allowed to delete or edit their own posts, events, and workouts, but anyone can view posts, events, and workouts created by other users.

* Filter and sort
   * Users can filter posts by year or search for text within the post articles using the search field in view.html.
   * Workouts can also be filtered and searched in workouts.html. The search filter uses the same logic as the post filter. Users can filter workouts based on category and sub-category (fokusområdet) using dropdowns. The filters applied by the user are stored in cookies, so when the user revisits workouts.html with the same browser, the workouts.html page is pre-filtered based on their previous filter selections.

* Image Gallery
   * I have utilized a grid layout to display images in a gallery format.
   * When a user clicks on an image in the post.html file, the image enlarges, and they can navigate through the image gallery.

* Weather
   * YR.no weather widget is embedded to the front page (index.html)
   * By modifying the url i was able to get the weather forecast for the desired location.

* Image storage
   * I am using ImageKit.io as a third-party service for storing my images. Storing the images on ImageKit allows me to reduce the amount of space used in the SQLite database.
   * ImageKit.io is also excellent at compressing images displayed on the website. Instead of fetching images from the server with a size of 3 MB, I can now download images from ImageKit at around 50 KB.
   * ImageKit.io provides features to transform images on the fly by modifying the URL.
   * I am utilizing the ImageKit.io API for uploading images from the server-side.
   * Additionally, I am using the API to delete images that users have removed while editing their posts in edit_post.html.
   * The image reference (imagekit-url) is stored in the SQLite database.

* Calendar
   * I have integrated the fullCalendar JavaScript package for booking functionality.
   * Users can create an event (reserve the cabin) by clicking on a date. A Bootstrap modal will appear, allowing the user to select the start and end dates, as well as enter a title and description for the stay. After submitting the event, it will be displayed in the calendar.
   * Events can be edited by clicking on them. A Bootstrap modal will appear, providing options to update or delete the event.
   * Users can only edit or delete their own events.
   * The admin has the authority to edit and delete all events.


By implementing these features and functionalities, the "digital hyttebok" website provides a comprehensive platform for cabin guests to register, share their experiences, post workouts, check cabin availability, and interact with various elements of the application.
