from app import app, db, Users, Posts, Image, BookingEvent, Workout, WorkoutCategory, WorkoutSubCat, datetime

with app.app_context():

    # Creates all the tables. Converting table models into tables in db
    
    db.create_all()

    # Set up admin user
    user1 =  Users("Admin","Rongve","admin@gmail.com","=Jsbeiro9a!!")

    fromDate = "2023-05-13"
    toDate = "2023-05-19"
    fromDateObject = datetime.strptime(fromDate,'%Y-%m-%d')
    toDateObject = datetime.strptime(toDate,'%Y-%m-%d')

    fromDate2 = "2023-06-13"
    toDate2 = "2023-06-19"
    fromDateObject2 = datetime.strptime(fromDate2,'%Y-%m-%d')
    toDateObject2 = datetime.strptime(toDate2,'%Y-%m-%d')

    # Create some records
    post1 = Posts("Test Post","Easter 2023",fromDateObject,toDateObject,user_id=1)
    event1 = BookingEvent("Fitjar med venner","Jeg har booket hytten og skal ha med venner dit. Har avtalt med morfar og mormor",fromDateObject,toDateObject,user_id=1)
    event2 = BookingEvent("Stranda med venner","Jeg har booket hytten og skal ha med venner dit.",fromDateObject2,toDateObject2,user_id=1)
    event3 = BookingEvent("Stranda med fam","Jeg har booket hytten og skal ha med venner dit. Jeg har booket hytten og skal ha med venner dit. Jeg har booket hytten og skal ha med venner dit. Jeg har booket hytten og skal ha med venner dit. Jeg har booket hytten og skal ha med venner dit. Jeg har booket hytten og skal ha med venner dit. Jeg har booket hytten og skal ha med venner dit. Jeg har booket hytten og skal ha med venner dit.",fromDateObject2,toDateObject2,user_id=1)


    # Set up workout categories
    category1 = WorkoutCategory("Styrke")
    category2 = WorkoutCategory("Kondisjon")

    # Set up workout sub categories
    subcat1 = WorkoutSubCat("Mage/rygg")
    subcat2 = WorkoutSubCat("Mage")
    subcat3 = WorkoutSubCat("Rygg")
    subcat4 = WorkoutSubCat("Full kroppsøkt")
    subcat5 = WorkoutSubCat("Bein")
    subcat6 = WorkoutSubCat("Overkropp")
    subcat7 = WorkoutSubCat("Intervaller")
    subcat8 = WorkoutSubCat("Langkjøring")

    # Add workouts
    workout1 = Workout("Fitjar Attack",30,"Tre runder med burpees","Fitjar",1,4,1)
    workout2 = Workout("Fitjar Attack 2",30,"10 situps","Fitjar",1,4,1)
    workout3 = Workout("Midtfjellet 10x1000m",60,"10 x 1000 m rundt tjønnet på midtfjellet","Fitjar",2,7,1)

    db.session.add_all([user1])
    db.session.add_all([event1])
    db.session.add_all([event2])
    db.session.add_all([event3])

    db.session.add_all([category1,category2,subcat1,subcat2,subcat3,subcat4,subcat5,subcat6,subcat7,subcat8,workout1,workout2,workout3])

    db.session.commit()