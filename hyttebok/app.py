# virtual env: hyttebokenv

from flask import Flask, render_template, request, redirect,url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_login import UserMixin, LoginManager, login_user, login_required, logout_user, current_user
import uuid
import os
from imagekitio import ImageKit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions
import psycopg2
from flask_sslify import SSLify

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
# Secret key
app.config["SECRET_KEY"] = 'Thisisasecretkey!'
# Add database
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://kpyqwecgjfyjjo:210b80db23ee4506d7e471e67417f04865625db2177e3a65cfde30160e184a54@ec2-63-34-16-201.eu-west-1.compute.amazonaws.com:5432/db7013evohkmgt'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Image config
app.config["ALLOWED_IMAGE_EXTENSIONS"] = ["PNG","JPG", "JPEG"]
# Initialize database
db =  SQLAlchemy(app)
# Connect the application with the database using Migrate
Migrate(app,db)

# Initialize ImageKit. For storing images on a different platform. 
# Very good for compression and performance
# Using client side for uploading images but using server side for deleting images. That is
# the reason for creating this imagekit object her. Will remove when i change the method
# for deleting images.
imagekit = ImageKit(
    private_key="private_nX79GaYPafecH3KILRRDlug62zs=",
    public_key="public_1+etL/esvZQB92BtXRpMoYkLf6s=",
    url_endpoint=" https://ik.imagekit.io/hts792344"
)

auth_params =  imagekit.get_authentication_parameters()

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return Users.query.get(int(user_id))

# Create Users Model
class Users(db.Model, UserMixin):

    # Table name
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    firstname = db.Column(db.String(200),nullable=False)
    lastname = db.Column(db.String(200),nullable=False)
    email = db.Column(db.String(120), nullable=False,unique=True)
    password_hash = db.Column(db.String(128))
    date_added = db.Column(db.DateTime, default=datetime.utcnow())
    # One to many relationship between users and posts. A post can only have one user
    posts = db.relationship('Posts',backref="post")
    events = db.relationship('BookingEvent',backref="user")
    workouts = db.relationship('Workout',backref='user')


    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self,password):
        self.password_hash=generate_password_hash(password)

    def verify_password(self,password):
        return check_password_hash(self.password_hash,password)

    def __init__(self,firstname,lastname,email,password_hash):
        self.firstname = firstname
        self.lastname = lastname
        self.email = email
        self.password_hash = generate_password_hash(password_hash)

    # Create A string
    def __repr__(self):
        return f"Id: {self.id}, FirstName: {self.firstname}, LastName: {self.lastname}, Email: {self.email}, Date Added: {self.date_added}, Password: {self.password_hash}"

# Create Blog Post Model
class Posts(db.Model, UserMixin):

    # Table name
    __tablename__ = 'posts'

    id = db.Column(db.Integer,primary_key=True)
    blog_title = db.Column(db.String(65), nullable=False)
    blog_content = db.Column(db.TEXT, nullable=False)
    fromDate = db.Column(db.DATE,nullable=False)
    toDate = db.Column(db.DATE,nullable=False)
    # One to many relationship between users and posts
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    # Added cascading so that related images can be deleted when deleting a post
    images = db.relationship('Image',backref="blog_post",lazy=True,cascade='all, delete')

    def __init__(self,blog_title,blog_content,fromDate,toDate,user_id):
        self.blog_title = blog_title
        self.blog_content = blog_content
        self.fromDate = fromDate
        self.toDate = toDate
        self.user_id = user_id

    def __repr__(self):
        return f"Id: {self.id}, Title: {self.blog_title}, from: {self.fromDate}, to: {self.toDate}, owner: {self.user_id}"
    
# Create Image Model
class Image(db.Model):

    # Table name in sqlite database is: image

    id = db.Column(db.Integer,primary_key=True)
    # url for the image stored on imagekit
    imgkit_url = db.Column(db.Text,nullable=False)
    # id for the image stored on imagekit
    imgkit_id = db.Column(db.Text,nullable=False)
    # One to many relationship between posts and images
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)

# Create Booking Event Model
class BookingEvent(db.Model):

    __tablename__ = "bookingevent"

    id = db.Column(db.Integer,primary_key=True)
    event_title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.TEXT, nullable=False)
    startdate = db.Column(db.DATE, nullable=False)
    enddate = db.Column(db.DATE, nullable=False)
    # One to many relationship between users and booking event
    user_id = db.Column(db.Integer,db.ForeignKey('users.id'),nullable=False)

    def __init__(self,event_title,description,startdate,enddate,user_id):
        self.event_title = event_title
        self.description = description
        self.startdate = startdate
        self.enddate = enddate
        self.user_id = user_id

# Create Workout Model
class Workout(db.Model):

    __tablename__ = "workout"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    time = db.Column(db.Integer,nullable=False)
    description = db.Column(db.TEXT,nullable=False)
    sted = db.Column(db.String(100),nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('workoutcategory.id'), nullable=False)
    sub_category_id = db.Column(db.Integer, db.ForeignKey('workoutsubcategory.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __init__(self,name,time,description,sted,category_id,sub_category_id,owner_id):
        self.name=name
        self.time=time
        self.description=description
        self.sted=sted
        self.category_id=category_id
        self.sub_category_id=sub_category_id
        self.owner_id=owner_id

# Create Workout Category Model
class WorkoutCategory(db.Model):

    __tablename__ = "workoutcategory"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    workouts = db.relationship('Workout', backref='category')

    def __init__(self,name):
        self.name=name

# Create Workout Subcategory Model
class WorkoutSubCat(db.Model):

    __tablename__ = "workoutsubcategory"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False) 
    workouts = db.relationship('Workout', backref='sub_category')

    def __init__(self,name):
        self.name=name

@app.route('/auth', methods=['GET','POST'])
def get_imagekit_token():
    # Initialize ImageKit with your private API key
    imagekit = ImageKit(
        private_key="private_nX79GaYPafecH3KILRRDlug62zs=",
        public_key="public_1+etL/esvZQB92BtXRpMoYkLf6s=",
        url_endpoint="https://ik.imagekit.io/hts792344"
    )

    # Generate the authentication token
    token = imagekit.get_authentication_parameters()

    # Return the token as a JSON response
    return jsonify(token)

# register_user.html
@app.route('/register_user',methods=["GET", "POST"])
@login_required
def register_user():
    errorConfirmPassword = False
    errorEmailExist = False
    success_message = False
    error_message = False
    if request.method == "POST":
        email = (request.form['email']).lower()
        firstname = str(request.form['firstname']).capitalize().strip()
        lastname = str(request.form['lastname']).capitalize().strip()
        email = request.form['email']
        password_hash = request.form['password']
        confirmPassword = request.form['confirmPassword']
        full_name = firstname + " " + lastname
        # Query database to check if email already exist
        user =  Users.query.filter_by(email=email).first()
        if user is None:
            if confirmPassword != password_hash:
                errorConfirmPassword = True
                return render_template('register_user.html',errorConfirmPassword=errorConfirmPassword)
            else:
                try:
                    user = Users(firstname,lastname,email,password_hash)
                    db.session.add(user)
                    db.session.commit()
                    print("User Added Successfully!")
                    success_message =  True
                    return render_template('register_user.html', success_message=success_message, error_message=error_message,full_name=full_name)
                except Exception as e:
                    print("There was an error while adding the user to the database. Error message: " + str(e))
                    error_message = True
                    return render_template('register_user.html', success_message=success_message, error_message=error_message)
        else:
            errorEmailExist = True
            print("Email already exist in database")
            return render_template('register_user.html',errorEmailExist=errorEmailExist)
    return render_template('register_user.html',errorConfirmPassword=errorConfirmPassword,errorEmailExist=errorEmailExist)

# index.html
@app.route('/home')
@login_required
def index():
    logged_in_user = Users.query.filter_by(id=current_user.id).first()
    count_posts = Posts.query.count()
    show_slider = False
    show_next = False
    show_blog_post = False
    if count_posts != 0:
        show_blog_post = True
        last_post = Posts.query.order_by(Posts.id.desc()).first()
        images = Image.query.filter_by(post_id=last_post.id).all()
        # Logic to hide image slider in the post does not contain any images
        if len(images) != 0:
            show_slider = True
            if len(images)>1:
                show_next = True
        transformed_images = []
        for image in images:
            transformed_images.append(urlTransform(image.imgkit_url)) 
        return render_template("index.html",show_blog_post=show_blog_post,last_post=last_post,show_slider=show_slider,show_next=show_next,images=transformed_images, logged_in_user=logged_in_user)
    else:
        return render_template("index.html", show_blog_post=show_blog_post,show_next=show_next,show_slider=show_slider,logged_in_user=logged_in_user)
    
# Function to add images transformation to the image url for imageKit
def urlTransform(url):
    part1,part2 = url.rsplit('/',1)
    transformation =  "/tr:h-400,ar-1/"
    transformed_url = part1 + transformation + part2
    return transformed_url

# login.html
@app.route('/', methods=["GET","POST"])
def login():
    showError = False
    showNoneUser = False
    if request.method == "POST":
        email=(request.form["email"]).lower()
        password=request.form["password"]
        # Use email to check if email address exist, and then check if password entered matches password in database
        user = Users.query.filter_by(email=email).first()
        if user:
            # Check password entered in the form against hashed password in database
            if user.verify_password(password):
                login_user(user)
                return redirect(url_for('index'))
            else:
                showError = True
                return render_template("login.html",showError=showError,showNoneUser=showNoneUser)
        else:
            showNoneUser = True
            return render_template("login.html",showError=showError,showNoneUser=showNoneUser)
    return render_template("login.html",showError=showError,showNoneUser=showNoneUser)

# logut.html
@app.route('/logout',methods=["GET","POST"])
@login_required
def logout():
    logout_user()
    return render_template("login.html")
    
# AJAX request used for deleting user from users list. Updating table without refreshing the page.
@app.route('/delete_item', methods=["DELETE"])
@login_required
def delete_item():
    if request.method=="DELETE":
        req = request.get_json()
        user_id = int(req["id"])
        delete_selected_user = Users.query.get_or_404(user_id)
        posts = Posts.query.filter_by(user_id=user_id).all()
        workouts = Workout.query.filter_by(owner_id=user_id).all()
        events = BookingEvent.query.filter_by(user_id=user_id).all()
        try:
            # Change owner to admin for all posts owned by deleted user
            if len(posts) != 0:
                for post in posts:
                    selected_post = Posts.query.get(post.id)
                    selected_post.user_id = 1
                    db.session.commit()
            # Change owner to admin for all workouts owned by deleted user
            if len(workouts) != 0:
                for workout in workouts:
                    selected_workout = Workout.query.get(workout.id)
                    selected_workout.owner_id = 1
                    db.session.commit()
            # Change owner to admin for all events owned by deleted user
            if len(events) != 0:
                for event in events:
                    selected_event = BookingEvent.query.get(event.id)
                    selected_event.user_id = 1
                    db.session.commit()
            # Delete selected user from user table
            db.session.delete(delete_selected_user)
            db.session.commit()
            new_user_list = Users.query.all()
            result = []
            for user in new_user_list:
                x = repr(user)
                items = split_string(x)
                result.append({
                    'Id': items[0],
                    'FirstName': items[1],
                    'LastName': items[2],
                    'Email': items[3],
                    'Date Added': items[4],
                    'Password': items[5]
                })
            response_message = jsonify(result)
            return response_message
        except Exception as e:
            print("Ops, there was an error deleting the user! Error message: " + str(e))
            response_message = {
                "status":"error",
                "message":"There was an error deleting the user!"
            }
            return response_message

# AJAX request for deleting blog post from view html
@app.route('/delete_blog_post', methods=["DELETE"])
@login_required
def delete_blog_post():
    if request.method=="DELETE":
        req = request.get_json()
        delete_selected_post = Posts.query.get_or_404(req["id"])
        try:
            db.session.delete(delete_selected_post)
            db.session.commit()
            result = []
            new_post_list = Posts.query.all()
            for post in new_post_list:
                x = repr(post)
                items = split_string(x)
                result.append({
                    'id': items[0],
                    'blog_title': items[1],
                    "fromDate": items[2],
                    "toDate": items[3],
                    "user_id": items[4],
                    "firstname": Users.query.filter_by(id=items[4]).first().firstname,
                    "lastname": Users.query.filter_by(id=items[4]).first().lastname
                })
                response = jsonify(result)
        except:
            print("Ops, there was an error deleting the post!")
        return response
    
@app.route('/delete_post', methods=["DELETE"])
@login_required
def delete_post():
    if request.method == "DELETE":
        data = request.get_json()
        id = data.get("post_id")
        delete_entry = Posts.query.get_or_404(id)
        post_images = Image.query.filter_by(post_id=id).all()
        try:
            for image in post_images:
                imagekit.delete_file(file_id=image.imgkit_id)
                print("File deleted")
            if current_user.id == delete_entry.post.id or current_user.id == 1:
                try: 
                    try:
                        db.session.delete(delete_entry)
                        db.session.commit()
                    except Exception as e:
                        print("Error message: " + str(e))
                        response_message = {
                        "status":"error",
                        "message":"An error occured while trying to delete post from the database"
                        }
                        return jsonify(response_message)
                    response_message = []
                    new_post_list = Posts.query.all()
                    years = list_years(new_post_list)
                    response_message.append({"years":years})
                    for post in new_post_list:
                        x = repr(post)
                        items = split_string(x)
                        response_message.append({
                            'id': items[0],
                            'blog_title': items[1],
                            "fromDate": items[2],
                            "toDate": items[3],
                            "user_id": items[4],
                            "firstname": Users.query.filter_by(id=items[4]).first().firstname,
                            "lastname": Users.query.filter_by(id=items[4]).first().lastname
                        })
                    return jsonify(response_message)
                except Exception as e:
                    print("Error message: " + str(e))
                    response_message = {
                        "status":"error",
                        "message":"An error occured while trying fetch updated list of posts from the database"
                        }
                    return jsonify(response_message)
            else:
                print("You are not allowed to delete this post!")
                response_message = {
                    "status":"error",
                    "message":"You are not allowed to delete this post!"}
                return jsonify(response_message)
        except Exception as e:
            if str(e) == "The requested file does not exist.":
                if current_user.id == delete_entry.post.id or current_user.id == 1:
                    try:
                        try:
                            db.session.delete(delete_entry)
                            db.session.commit()
                        except Exception as e:
                            print("Error message: " + str(e))
                            response_message = {
                            "status":"error",
                            "message":"An error occured while trying to delete post from the database"
                            }
                            return jsonify(response_message)
                        response_message = []
                        new_post_list = Posts.query.all()
                        years = list_years(new_post_list)
                        response_message.append(years)
                        for post in new_post_list:
                            x = repr(post)
                            items = split_string(x)
                            response_message.append({
                                'id': items[0],
                                'blog_title': items[1],
                                "fromDate": items[2],
                                "toDate": items[3],
                                "user_id": items[4],
                                "firstname": Users.query.filter_by(id=items[4]).first().firstname,
                                "lastname": Users.query.filter_by(id=items[4]).first().lastname
                            })
                        return jsonify(response_message)
                    except Exception as e:
                        print("Error message: " + str(e))
                        response_message = {
                        "status":"error",
                        "message":"An error occured while trying fetch updated list of posts from the database"
                        }
                        return jsonify(response_message)
                else:
                    print("You are not allowed to delete this post!")
                    response_message = {
                    "status":"error",
                    "message":"You are not allowed to delete this post!"}
                return jsonify(response_message)
    else:
        print("Error message" + str(e))
        response_message = {"message":"not success"}
        return jsonify(response_message)

# add_new_post.html
@app.route('/addpost', methods=["GET","POST"])
@login_required
def addpost():
    if request.method == "POST":
        data = request.get_json()
        user_posted = current_user.id
        blog_title = data["blogTitle"]
        # Server side validation
        if len(blog_title)==0:
            response_data  = {"status":"error",
                              "message":"Title must have some text"}
            return jsonify(response_data)
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        # Server side validation
        if len(fromDate) == 0 or len(toDate) == 0:
            response_data = {
                "status":"error",
                "message":"Both date needs to be filled out"
            }
            return jsonify(response_data)
        fromDateObject = datetime.strptime(fromDate,'%Y-%m-%d')
        toDateObject = datetime.strptime(toDate,'%Y-%m-%d')
        # Server side validation
        if fromDateObject > toDateObject:
            response_data  = {"status":"error",
                              "message":"From date needs to be before end date"}
            return jsonify(response_data)
        blog_content = data["blogContent"]
        # Server side validation
        if len(blog_content)==0:
            response_data  = {"status":"error",
                              "message":"Blog content must have some text"}
            return jsonify(response_data)
        new_post = Posts(blog_title,blog_content,fromDateObject,toDateObject, user_id = user_posted)
        try:
            db.session.add(new_post)
            db.session.commit()
        except Exception as e:
            print("Obs! There was an error adding the post data to the database. ERROR: " + str(e))
            response_data ={
                "status":"error",
                "message": "There was an error adding the data to the database"
            }
            return jsonify(response_data)
        # Fetch images from form
        files = data["images"]
        # Logic to handle that no image has been uploaded
        if len(files)!=0:
             # Loop through images, store in temp folder and commit to database.
            try:
                for file in files:
                    image = Image(imgkit_url=file['url'],imgkit_id=file['fileId'],post_id=new_post.id)
                    db.session.add(image)
                    db.session.commit()
                    print("Uploaded successfully!")
            except Exception as e:
                response_data = {"status":"error",
                                 'message':"Upload to ImageKit failed",
                                 "error_message" : str(e)}
                return jsonify(response_data)
        else:
            print("No image uploaded")
        response_data={
            "status":"success",
            "message":"All good!"
        }
        return jsonify(response_data)
    return render_template("add_new_post.html")


def delete_files(path):
    try:
        for file in os.listdir(path):
            os.remove(os.path.join(path,file))
    except:
        return "Error while removing files in temp folder!"

def allowed_image(filename):
    if not "." in filename:
        return False
    
    ext = filename.rsplit(".",1)[1]

    if ext.upper() in app.config["ALLOWED_IMAGE_EXTENSIONS"]:
        return True
    else:
        return False

# view.html
@app.route('/view')
@login_required
def view():
    list_posts = Posts.query.all()
    years = list_years(list_posts)
    sorted_list = sorted(list_posts, key=from_date, reverse=True)
    return render_template("view.html", sorted_list=sorted_list,years=years)

def from_date(post):
    return post.fromDate

def list_years(posts):
    years = []
    for post in posts:
        year = int(str(post.fromDate)[:4])
        years.append(year)
    unique_years = list(set(years))
    sorted_list = sorted(unique_years,reverse=True)
    sorted_list.append("Alle")
    return sorted_list

@app.route('/view_list/<string:year>',methods=["GET"])
@login_required
def view_list(year):
    if request.method == "GET":
        selected_year = year
        list_posts = Posts.query.all()
        sorted_list = sorted(list_posts, key=from_date, reverse=True)
        filtered_list = []
        for post in sorted_list:
            if selected_year == "Alle":
                x = repr(post)
                items = split_string(x)
                filtered_list.append({
                            'id': items[0],
                            'blog_title': items[1],
                            "fromDate": items[2],
                            "toDate": items[3],
                            "user_id": items[4],
                            "firstname": Users.query.filter_by(id=items[4]).first().firstname,
                            "lastname": Users.query.filter_by(id=items[4]).first().lastname,
                            "current_user_id":current_user.id
                    })
            else:
                if str(post.fromDate)[:4] == selected_year:
                    x = repr(post)
                    items = split_string(x)
                    filtered_list.append({
                                'id': items[0],
                                'blog_title': items[1],
                                "fromDate": items[2],
                                "toDate": items[3],
                                "user_id": items[4],
                                "firstname": Users.query.filter_by(id=items[4]).first().firstname,
                                "lastname": Users.query.filter_by(id=items[4]).first().lastname,
                                "current_user_id":current_user.id
                        })
    return jsonify(filtered_list)

# post.html
@app.route('/posts/<int:id>',methods=["GET"])
@login_required
def post(id):
    post = Posts.query.get_or_404(id)
    images = Image.query.filter_by(post_id=id).all()
    if len(images) != 0:
        show_slider = True
        if len(images) > 1:
            show_next = True
        else:
            show_next = False
    else:
        show_slider = False
        show_next = False
    return render_template ('post.html',post=post, images=images,show_slider=show_slider, show_next=show_next)

# edit_post.html
@app.route('/edit/<int:id>',methods=["GET","POST"])
@login_required
def edit_post(id):
    post = Posts.query.get_or_404(id)
    images = Image.query.filter_by(post_id=post.id).all()
    if len(images) != 0:
        show_slider = True
        if len(images)>1:
            show_next=True
        else:
            show_next=False
    else:
        show_slider = False
        show_next = False
    if request.method == "POST":
        data = request.get_json()
        fromDate = data["fromDate"]
        toDate = data["toDate"]
        post.blog_title = data['blogTitle']
        post.fromDate = datetime.strptime(fromDate,'%Y-%m-%d')
        post.toDate = datetime.strptime(toDate,'%Y-%m-%d')
        post.blog_content = data['blogContent']
        try:
            db.session.add(post)
            db.session.commit()
            print("Post has been updated!!!")
        except Exception as e:
            print("There was a problem saving the changes to the database. Error message: " + str(e))
            response_message = {
                "status":"error",
                "message":"There was a problem saving the changes to the database"
            }
            return jsonify(response_message)
        # Add more images to post
        # Fetch images from form
        files = data["images"]
        if len(files)!=0:
            try:
                for file in files:
                    image = Image(imgkit_url=file['url'],imgkit_id=file['fileId'],post_id=post.id)
                    db.session.add(image)
                    db.session.commit()
                    print("upload successful!")
            except Exception as e:
                print("Obs! There was an error adding the images to the database. ERROR: " + str(e))
                response_message = {
                    'status':'error',
                    'message':'There was an error uploading the image to ImageKit or saving the image reference to the database'}
                return jsonify(response_message)
        else:
            print("No image uploaded")
        try: 
            # get updated list of images to be viewed on page
            images_updated = Image.query.filter_by(post_id=post.id).all()
            list_images = []
            for img in images_updated:
                img = {"file_id":img.imgkit_id,"url":img.imgkit_url,"img_id":img.id,"post_id":post.id}
                list_images.append(img)
        except Exception as e:
            print("Obs! Error fetching updated images from database. Error message: " + str(e))
            response_message = {
                    'status':'error',
                    'message':'An error occured while fetching the images from the database'}
            return jsonify(response_message)
        return jsonify(list_images)
    return render_template('edit_post.html',post=post,show_slider=show_slider,show_next=show_next,images=images)

# list_users.html
@app.route('/list_users')
@login_required
def list_users():
    id = current_user.id
    if id == 1:
        users = Users.query.all()
        return render_template("list_users.html",users=users)
    else:
        return redirect(url_for('index'))

@app.route("/delete_image",methods=["DELETE"])
@login_required
def delete_image():
    if request.method == "DELETE":
        data = request.get_json()
        selected_file_id = data.get("file_id")
        selected_image_id = data.get("image_id")
        post_id = data.get("post_id")
        try: 
            imagekit.delete_file(file_id=selected_file_id)
        except Exception as e:
            response_message = {
                "status":"error",
                "message":"An error occured while deleting image from ImageKit"                
                }
            return jsonify(response_message)
        try:
            delete_image = Image.query.get_or_404(selected_image_id)
            db.session.delete(delete_image)
            db.session.commit()
        except Exception as e:
            response_message = {
                "status":"error",
                "message":"An error occured while trying to delete the image reference from the database"
                }
            return jsonify(response_message)
        updated_post_gallery = Image.query.filter_by(post_id=post_id).all()
        if updated_post_gallery != 0 or None:
            response_message = []
            for img in updated_post_gallery:
                response_message.append({
                    "file_id":img.imgkit_id,
                    "url":img.imgkit_url,
                    "img_id":img.id,
                    "post_id":post_id
                })
            return jsonify(response_message)
        else:
            response_message = {
                "status":"success",
                "message":"The post does not contain any images",
                "images":0
            }
            return jsonify(response_message)

def split_string(string):
    # Split the string into key-value pairs
    pairs = string.split(", ")

    # Extract the values from the key-value pairs
    values = [pair.split(": ")[1] for pair in pairs]

    # Convert the values to integers and return them as a list
    return [(value) for value in values]

@app.route('/cal')
@login_required
def cal():
    return render_template("calendar.html",events=get_events())
    
def get_events():
    all_events = BookingEvent.query.all()
    list_events = []
    for event in all_events:
        owner_name = str(event.user.firstname) + " " + str(event.user.lastname)
        event_object = {
            "id":str(event.id),
            "title":event.event_title,
            "start":str(event.startdate),
            "end":str(event.enddate),
            "extendedProps": {
                "description":event.description,
                "owner":owner_name
            }
        }
        list_events.append(event_object)
    return list_events

@app.route("/add_event",methods=["POST"])
@login_required
def add_event():
    if request.method == "POST":
        user = current_user.id
        event_title = request.form['booking-title']
        fromDate = request.form['booking-start']
        toDate = request.form['booking-end']
        description = request.form['booking-description']
        fromDateObject = datetime.strptime(fromDate,'%Y-%m-%d')
        toDateObject = datetime.strptime(toDate,'%Y-%m-%d')
        toDateObject += timedelta(days=1)  
        new_booking = BookingEvent(event_title=event_title,description=description,startdate=fromDateObject,enddate=toDateObject,user_id=user)
        try:
            db.session.add(new_booking)
            db.session.commit()
        except Exception as e:
            print("Obs! There was an error adding the post data to the database. ERROR: " + e)
        return redirect(url_for('cal'))

@app.route("/delete_event",methods=["DELETE"])
@login_required
def delete_event():
    if request.method == "DELETE":
        data = request.get_json()
        id = data.get("event_id")
        delete_entry = BookingEvent.query.get_or_404(id)
        try:
            db.session.delete(delete_entry)
            db.session.commit()
            response_message = get_events() 
            return jsonify(response_message)
        except Exception as e:
            print("Obs! There was an error deleting the event. Error message: " + str(e))
            response_message = {
                "status":"error",
                "message":"An error occured while trying to delete the selected event from the database"
                }
            return jsonify(response_message)
        
@app.route("/edit_event",methods=["POST"])
@login_required
def edit_event():
    if request.method=="POST":
        event_id = request.form['eventid']
        event_title = request.form['booking-title']
        fromDate = request.form['booking-start']
        toDate = request.form['booking-end']
        description = request.form['booking-description']
        fromDateObject = datetime.strptime(fromDate,'%Y-%m-%d')
        toDateObject = datetime.strptime(toDate,'%Y-%m-%d')
        toDateObject += timedelta(days=1)  

        # get booking event by id
        event =  BookingEvent.query.get_or_404(event_id)

        event.event_title = event_title
        event.startdate = fromDateObject
        event.enddate = toDateObject
        event.description = description
        event.user_id = current_user.id
        try:
            db.session.add(event)
            db.session.commit()
            print("Event has been updated!!!")
        except Exception as e:
            print("There was a problem updating the event!" + str(e))
    return redirect(url_for('cal'))

@app.route("/get_user",methods=["GET"])
@login_required
def get_user():
    if request.method == "GET":
        try:
            user_id = current_user.id
            response_message = {"user_id":user_id}
            return jsonify(response_message)
        except Exception as e:
            print("Error message: " + str(e))
            response_message = {
                "status":"error",
                "message":"An error occured while trying to retrieve current user id"
            }
            return jsonify(response_message)
    
@app.route("/event_owner_id", methods=["POST"])
@login_required
def event_owner_id():
    if request.method=="POST":
        try:
            event_id = request.get_json().get("event_id")
            event = BookingEvent.query.get_or_404(event_id)
            event_user_id = event.user_id
            response_message = {
                "status":"success",
                "user_id":event_user_id
                }
            return jsonify(response_message)
        except Exception as e:
            print("Obs! There was an error fetching the user id. " + str(e))
            response_message = {
                "status":"error",
                "message":"An error occured while fetching owner id from event"
            }
            return jsonify(response_message)

@app.route('/workouts',methods=["GET"])
@login_required
def workouts():
    list_workouts = Workout.query.all()
    categories = WorkoutCategory.query.all()
    subcategories = WorkoutSubCat.query.all()
    list_workouts.reverse()
    return render_template("workouts.html",list_workouts=list_workouts,categories=categories,subcategories=subcategories)

@app.route('/add_workout',methods=["GET"])
@login_required
def add_workout():
    categories = WorkoutCategory.query.all()
    subcategories = WorkoutSubCat.query.all()
    return render_template("add_workout.html",categories=categories,subcategories=subcategories)

@app.route("/add_new_workout",methods=["POST"])
@login_required
def add_new_workout():
    if request.method=="POST":
        name = request.form["title"]
        time = int(request.form["duration"])
        sted = request.form["location"]
        description = request.form["description"]
        category_id = request.form["category"]
        sub_category_id = request.form["subcategory"]
        user_id = current_user.id
        new_workout = Workout(name=name,time=time,sted=sted,description=description,category_id=category_id,sub_category_id=sub_category_id,owner_id=user_id)
        try:
            db.session.add(new_workout)
            db.session.commit()
        except Exception as e:
            print("There was an error adding the workout to the database." + str(e))
            return render_template("add_workout.html")
    return redirect(url_for('workouts'))

@app.route("/workout/<int:id>",methods=["GET"])
@login_required
def workout(id):
    selected_workout=Workout.query.get_or_404(id)
    return render_template("workout.html",selected_workout=selected_workout)

@app.route("/delete_workout",methods=["DELETE"])
@login_required
def delete_workout():
    if request.method == "DELETE":
        data = request.get_json()
        id = data.get("workoutID")
        workout = Workout.query.get_or_404(id)
        workout_owner_id = workout.owner_id
        if current_user.id == 1 or workout_owner_id == current_user.id:
            try:
                db.session.delete(workout)
                db.session.commit()
            except Exception as e:
                print("Error message: " + str(e))
                response_message = {"status":"error",
                    "message":"An error occured while trying to delete the workout"}
                return jsonify(response_message)
            try:
                workouts = Workout.query.all()
                updated_workout_list = []
                for workout in workouts:
                    workout_obj = {
                        "id":workout.id,
                        "name":workout.name,
                        "time":workout.time,
                        "sted":workout.sted,
                        "category_id":workout.category_id,
                        "sub_category_id":workout.sub_category_id,
                        "owner_id":workout.owner_id,
                        "current_user_id":current_user.id
                    }
                    updated_workout_list.append(workout_obj)
                    updated_workout_list.reverse()
                return jsonify(updated_workout_list)
            except Exception as e:
                print("Error message: " + str(e))
                response_message = {
                    "status":"error",
                    "message":"An error occured while fetching workout data from database"
                }
                return jsonify(response_message)
        else:
            print("you are not allowed to delete this post!")
            response_message = {
                "status":"error",
                "message":"You are not allowed to delete this record"
                }
            return jsonify(response_message)
            
@app.route("/edit_workout/<int:id>",methods=["GET","POST"])
@login_required
def edit_workout(id):
    selected_workout=Workout.query.get_or_404(id)
    current_sub_cat = selected_workout.sub_category_id
    current_cat = selected_workout.category_id
    categories = WorkoutCategory.query.all()
    subcategories = WorkoutSubCat.query.all()
    reOrderSubCat = reorderList(subcategories,current_sub_cat)
    reOrderCat = reorderList(categories,current_cat)
    if request.method=="POST":
        selected_workout.name = request.form["title"]
        selected_workout.time = request.form["duration"]
        selected_workout.description = request.form["description"]
        selected_workout.category_id = request.form["category"]
        selected_workout.sub_category_id = request.form["subcategory"]
        try:
            db.session.add(selected_workout)
            db.session.commit()
            print("Workout has been updated!")
            response_message = {
                "status":"success",
                "message":"Workout has been updated!"}
            return jsonify(response_message)
        except Exception as e:
            print("There was an error updating the workout!")
            response_message = {
                "status":"error",
                "message":"An error occured while updating the the workout!"}
            return jsonify(response_message)
    return render_template("edit_workout.html",selected_workout=selected_workout,categories=reOrderCat,subcategories=reOrderSubCat,current_user=current_user.id)

def reorderList(list_items,current_cat):
    x = 0
    for el in list_items:
        if str(current_cat) == str(el.id):
            poppedCategory = list_items.pop(x)
        x += 1
    list_items.insert(0,poppedCategory)
    return list_items

if __name__ == "__main__":
    if 'DYNO' in os.environ:
        sslify = SSLify(app)
    app.run()