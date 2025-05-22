from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
import pytz
from datetime import datetime
from bson import ObjectId
import bcrypt  # Add this import
import re

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "your-secret-key"
# Update CORS configuration to use specific origins
CORS(app, resources={r"/*": {"origins": "http://localhost:5173", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}}, supports_credentials=True)

from flask_jwt_extended import JWTManager
jwt = JWTManager(app)

client = MongoClient("mongodb+srv://test:test@cluster0.81qy6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["Finals"]
admins_collection = db["admins"]
counselors_collection = db["counselors"]
students_collection = db["students"]

# FUNCTION TO HASH PASSWORD
def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

# FUNCTION TO VERIFY PASSWORD
def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed)

@app.route('/create/admin', methods=['POST'])
def create_admin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    if admins_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already exists.'}), 409

    hashed_pw = hash_password(password)
    admins_collection.insert_one({'email': email, 'password': hashed_pw})
    return jsonify({'message': 'Admin registered successfully.'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    # Check admin collection
    admin = admins_collection.find_one({'email': email})
    if admin and bcrypt.checkpw(password.encode('utf-8'), admin['password']):
        access_token = create_access_token(identity=email)
        return jsonify({'message': 'Login successful', 'role': 'admin', 'access_token': access_token}), 200

    # Check counselor collection
    counselor = counselors_collection.find_one({'email': email})
    if counselor and bcrypt.checkpw(password.encode('utf-8'), counselor['password']):
        access_token = create_access_token(identity=email)
        return jsonify({'message': 'Login successful', 'role': 'counselor', 'access_token': access_token}), 200
        
    # Check student collection
    student = students_collection.find_one({'email': email})
    if student and bcrypt.checkpw(password.encode('utf-8'), student['password']):
        access_token = create_access_token(identity=email)
        return jsonify({'message': 'Login successful', 'role': 'student', 'access_token': access_token}), 200

    return jsonify({'error': 'Invalid email or password'}), 401

# Route to create a counselor (admin only)
@app.route('/admin/create/counselor-account', methods=['POST'])
@jwt_required()
def create_counselor():
    current_user_email = get_jwt_identity()
    user = admins_collection.find_one({"email": current_user_email})

    if not user:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json

    if counselors_collection.find_one({"email": data["email"]}):
        return jsonify({"message": "Email already exists"}), 400

    if data["password"] != data["confirm_password"]:
        return jsonify({"message": "Passwords do not match"}), 400

    # Set up Philippine Time
    ph_timezone = pytz.timezone("Asia/Manila")
    created_at = datetime.now(ph_timezone).strftime("%Y-%m-%d %H:%M:%S")

    hashed_password = hash_password(data["password"])
    counselor_account = {
        "email": data["email"],
        "password": hashed_password,
        "firstname": data["firstname"],
        "lastname": data["lastname"],
        "created_at": created_at
    }

    counselors_collection.insert_one(counselor_account)
    return jsonify({"message": "Counselor account created successfully"}), 201

#READ
@app.route('/admin/counselors', methods=['GET'])
@jwt_required()
def get_counselors():
    current_user_email = get_jwt_identity()
    user = admins_collection.find_one({"email": current_user_email})

    if not user:
        return jsonify({"message": "Unauthorized"}), 403

    counselors = []
    for counselor in counselors_collection.find({}, {"password": 0}):  # Exclude password
        counselor['_id'] = str(counselor['_id'])  # Convert ObjectId to string for JSON serialization
        counselors.append(counselor)

    return jsonify({"counselors": counselors}), 200

#DELETE
# DELETE route to delete a counselor
@app.route('/admin/delete/counselor/<counselor_id>', methods=['DELETE'])
@jwt_required()
def delete_counselor(counselor_id):
    # Ensure the current user is an admin
    current_user_email = get_jwt_identity()
    user = admins_collection.find_one({"email": current_user_email})

    if not user:
        return jsonify({"message": "Unauthorized"}), 403

    # Check if counselor exists
    try:
        counselor = counselors_collection.find_one({"_id": ObjectId(counselor_id)})
    except Exception as e:
        return jsonify({"message": "Invalid counselor ID"}), 400

    if not counselor:
        return jsonify({"message": "Counselor not found"}), 404

    # Delete the counselor
    counselors_collection.delete_one({"_id": ObjectId(counselor_id)})
    return jsonify({"message": "Counselor deleted successfully"}), 200

# UPDATE route to update a counselor's details
@app.route('/admin/update/counselor/<counselor_id>', methods=['PUT'])
@jwt_required()
def update_counselor(counselor_id):
    current_user_email = get_jwt_identity()
    user = admins_collection.find_one({"email": current_user_email})

    if not user:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    update_data = {}

    # Only update fields that are provided in the request
    if "email" in data:
        # Prevent duplicate emails
        if counselors_collection.find_one({"email": data["email"], "_id": {"$ne": ObjectId(counselor_id)}}):
            return jsonify({"message": "Email already exists"}), 400
        update_data["email"] = data["email"]

    if "firstname" in data:
        update_data["firstname"] = data["firstname"]

    if "lastname" in data:
        update_data["lastname"] = data["lastname"]

    if not update_data:
        return jsonify({"message": "No valid fields to update"}), 400

    result = counselors_collection.update_one(
        {"_id": ObjectId(counselor_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"message": "Counselor not found"}), 404

    return jsonify({"message": "Counselor updated successfully"}), 200

# Counselor get profile info
@app.route('/counselor/profile', methods=['GET'])
@jwt_required()
def get_counselor_profile():
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email}, {"password": 0})

    if not counselor:
        return jsonify({"message": "Counselor not found"}), 404

    counselor['_id'] = str(counselor['_id'])
    return jsonify({"counselor": counselor}), 200

#this route to assign courses/years to counselors
@app.route('/admin/counselor/<counselor_id>/assign', methods=['PUT'])
@jwt_required()
def assign_to_counselor(counselor_id):
    current_user_email = get_jwt_identity()
    admin = admins_collection.find_one({"email": current_user_email})
    
    if not admin:
        return jsonify({"message": "Unauthorized"}), 403
        
    try:
        data = request.get_json()
        assignments = data.get('assignments', [])
        
        # Validate assignments format
        if not isinstance(assignments, list):
            return jsonify({"message": "Assignments must be an array"}), 400
            
        # Update counselor with assignments
        result = counselors_collection.update_one(
            {"_id": ObjectId(counselor_id)},
            {"$set": {"assignments": assignments}}
        )
        
        if result.matched_count == 0:
            return jsonify({"message": "Counselor not found"}), 404
            
        return jsonify({"message": "Assignments updated successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# Modify the get_students route to filter by counselor assignments
@app.route('/counselor/students', methods=['GET'])
@jwt_required()
def get_students():
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403
    
    # Get query parameters
    level = request.args.get('level')
    course = request.args.get('course')
    year = request.args.get('year')
    section = request.args.get('section')
    
    # Get counselor assignments
    assignments = counselor.get('assignments', [])
    
    # Build query based on assignments
    query = {"$or": []}
    
    # If no assignments, return empty list
    if not assignments:
        return jsonify({"students": []}), 200
    
    # Build query for each assignment
    for assignment in assignments:
        assignment_type = assignment.get('type')
        value = assignment.get('value')
        
        if assignment_type == 'course':
            query["$or"].append({"level": "HED", "course": value})
        elif assignment_type == 'year':
            query["$or"].append({"level": "BED", "year": value})
    
    # If no valid assignments, return empty list
    if not query["$or"]:
        return jsonify({"students": []}), 200
    
    # Apply additional filters if provided
    if level or course or year or section:
        additional_query = {}
        if level:
            additional_query["level"] = level
        if level == "HED" and course:
            additional_query["course"] = course
        if level == "BED":
            if year:
                additional_query["year"] = year
            if section:
                additional_query["section"] = section
        
        # Combine with the assignments query
        query = {"$and": [query, additional_query]}
    
    students = []
    for student in students_collection.find(query, {"password": 0}):
        student['_id'] = str(student['_id'])
        students.append(student)
    
    return jsonify({"students": students}), 200

# Add this to your student remark endpoint
@app.route('/counselor/student/<student_id>/remarks', methods=['POST'])
@jwt_required()
def add_remark(student_id):
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403

    # Get the student by ID first
    student = students_collection.find_one({"_id": ObjectId(student_id)})
    if not student:
        return jsonify({"message": "Student not found"}), 404
        
    # Check if counselor has assignments
    assignments = counselor.get('assignments', [])
    
    # If counselor has no assignments, they can't access any students
    if not assignments:
        return jsonify({"message": "No assignments configured for this counselor"}), 403
        
    # Check if student matches any of the counselor's assignments
    has_access = False
    for assignment in assignments:
        assignment_type = assignment.get('type')
        value = assignment.get('value')
        
        if assignment_type == 'course' and student.get('level') == 'HED' and student.get('course') == value:
            has_access = True
            break
        elif assignment_type == 'year' and student.get('level') == 'BED' and student.get('year') == value:
            has_access = True
            break
    
    if not has_access:
        return jsonify({"message": "You don't have access to this student"}), 403

    data = request.get_json()
    remark_text = data.get("remark")
    mark_as_done = data.get("markAsDone", False)
    send_to_admin = data.get("sendToAdmin", False)
    
    if not remark_text and not mark_as_done:
        return jsonify({"message": "Remark text required"}), 400

    # Format: April 23, 2025 and 2:00 PM
    remark_date = datetime.now(pytz.timezone("Asia/Manila")).strftime("%B %d, %Y and %I:%M %p")

    remark = {
        "text": remark_text,
        "date": remark_date,
        "counselor": current_user_email,
        "counselor_name": f"{counselor['lastname']}, {counselor['firstname']}"
    }

    # Set up update data
    update_data = {
        "$push": {"remarks": remark},
        "$set": {"counselingDone": True}
    }
    
    # If sendToAdmin is true, set that flag as well
    if send_to_admin:
        update_data["$set"]["sentToAdmin"] = True

    result = students_collection.update_one(
        {"_id": ObjectId(student_id)},  # Remove the counselor_email check
        update_data
    )

    if result.matched_count == 0:
        return jsonify({"message": "Failed to update student"}), 500

    return jsonify({"message": "Remark added successfully."}), 200

# def make_json_serializable(obj):
#     if isinstance(obj, bytes):
#         return obj.decode('utf-8', errors='replace')
#     elif isinstance(obj, ObjectId):
#         return str(obj)
#     elif isinstance(obj, dict):
#         return {k: make_json_serializable(v) for k, v in obj.items()}
#     elif isinstance(obj, list):
#         return [make_json_serializable(item) for item in obj]
#     elif isinstance(obj, datetime):
#         return obj.strftime("%Y-%m-%d %H:%M:%S")
#     else:
#         return obj

# Modify the admin get_all_students function to filter by sentToAdmin instead of counselingDone
@app.route('/admin/students', methods=['GET'])
@jwt_required()
def admin_view_all_students():
    try:
        current_user_email = get_jwt_identity()
        admin = admins_collection.find_one({"email": current_user_email})
        if not admin:
            return jsonify({"message": "Unauthorized"}), 403
        
        # Get query parameters
        counseling_done = request.args.get('counselingDone')
        level = request.args.get('level')
        course = request.args.get('course')
        year = request.args.get('year')
        
        # Build query
        query = {}
        if counseling_done is not None:
            # Change this to use sentToAdmin instead of counselingDone
            query['sentToAdmin'] = counseling_done.lower() == 'true'
        if level:
            query['level'] = level
        if course:
            query['course'] = course
        if year:
            query['year'] = year
        
        students = list(students_collection.find(query))
        
        # Make all data JSON serializable
        serializable_students = make_json_serializable(students)
        
        return jsonify({"students": serializable_students}), 200
    except Exception as e:
        print(f"Error in get_all_students: {str(e)}")
        return jsonify({"message": f"Internal server error: {str(e)}"}), 500


# Create a new collection for appointments
appointments_collection = db["appointments"]

# 1. GET /student/assigned-counselor - Returns the counselor assigned to the student
@app.route('/student/assigned-counselor', methods=['GET'])
@jwt_required()
def get_assigned_counselor():
    current_user_email = get_jwt_identity()
    student = students_collection.find_one({"email": current_user_email})
    
    if not student:
        return jsonify({"message": "Student not found"}), 404
    
    # Get student's level and course/year
    level = student.get('level')
    course = student.get('course')
    year = student.get('year')
    
    # Find counselor with matching assignment
    query = {}
    if level == "HED" and course:
        query = {"assignments": {"$elemMatch": {"type": "course", "value": course}}}
    elif level == "BED" and year:
        query = {"assignments": {"$elemMatch": {"type": "year", "value": year}}}
    
    counselor = counselors_collection.find_one(query, {"password": 0})
    
    if not counselor:
        return jsonify({"message": "No counselor assigned to your course/year"}), 404
    
    counselor['_id'] = str(counselor['_id'])
    return jsonify({"counselor": counselor}), 200

# 2. POST /student/request-appointment - Creates a new appointment request
@app.route('/student/request-appointment', methods=['POST']) 
@jwt_required() 
def request_appointment(): 
    current_user_email = get_jwt_identity() 
    student = students_collection.find_one({"email": current_user_email}) 
    
    if not student: 
        return jsonify({"message": "Student not found"}), 404 
    
    data = request.get_json() 
    
    # Validate required fields 
    appointment_date = data.get('appointmentDate') 
    appointment_time = data.get('appointmentTime') 
    reason = data.get('reason') 
    counselor_id = data.get('counselorId') 
    
    if not appointment_date or not appointment_time or not reason or not counselor_id: 
        return jsonify({"error": "All fields are required"}), 400 
    
    # Get counselor information
    counselor = counselors_collection.find_one({"_id": ObjectId(counselor_id)})
    if not counselor:
        return jsonify({"error": "Counselor not found"}), 404
    
    # Create appointment object 
    appointment = { 
        "student_id": str(student["_id"]), 
        "student_name": f"{student['firstname']} {student['lastname']}", 
        "student_email": current_user_email, 
        "counselor_id": counselor_id, 
        "counselor_name": f"{counselor['firstname']} {counselor['lastname']}", 
        "appointment_date": appointment_date, 
        "appointment_time": appointment_time, 
        "reason": reason, 
        "status": "pending", 
        "created_at": datetime.now(pytz.timezone("Asia/Manila")).strftime("%Y-%m-%d %H:%M:%S") 
    } 
    
    # Insert appointment 
    result = appointments_collection.insert_one(appointment) 
    
    return jsonify({ 
        "message": "Appointment request submitted successfully", 
        "appointment_id": str(result.inserted_id) 
    }), 201

# 3. GET /counselor/appointments - Returns all appointments for a counselor
@app.route('/counselor/appointments', methods=['GET'])
@jwt_required()
def get_counselor_appointments():
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403
    
    # Get query parameters for filtering
    status = request.args.get('status')
    
    # Build query
    query = {"counselor_id": str(counselor["_id"])}
    if status:
        query["status"] = status
    
    # Get appointments
    appointments = []
    for appointment in appointments_collection.find(query).sort("appointment_date", 1):
        appointment['_id'] = str(appointment['_id'])
        appointments.append(appointment)
    
    return jsonify({"appointments": appointments}), 200

# 4. PUT /counselor/appointments/:id - Updates an appointment status
@app.route('/counselor/appointments/<appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment_status(appointment_id):
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.get_json()
    new_status = data.get('status')
    
    # Update to include "completed" and "no-show" as valid statuses
    if not new_status or new_status not in ["pending", "approved", "rejected", "completed", "failed to attend"]:
        return jsonify({"error": "Valid status (pending, approved, rejected, completed, failed to attend) is required"}), 400
    
    # Update appointment status
    result = appointments_collection.update_one(
        {"_id": ObjectId(appointment_id), "counselor_id": str(counselor["_id"])},
        {"$set": {"status": new_status}}
    )
    
    if result.matched_count == 0:
        return jsonify({"message": "Appointment not found or unauthorized"}), 404
    
    return jsonify({"message": f"Appointment status updated to {new_status}"}), 200

# Add endpoint for counselors to add remarks to appointments
@app.route('/counselor/appointments/<appointment_id>/remarks', methods=['POST'])
@jwt_required()
def add_appointment_remarks(appointment_id):
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403
    
    data = request.get_json()
    remark = data.get('remark')
    if not remark:
        return jsonify({"error": "Remark text is required"}), 400
    
    # First, get the appointment to find the student
    appointment = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        return jsonify({"message": "Appointment not found"}), 404
    
    # Format the date
    remark_date = datetime.now(pytz.timezone("Asia/Manila")).strftime("%B %d, %Y and %I:%M %p")
    
    # Update appointment with remarks
    appointments_collection.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"remarks": remark}}
    )
    
    # Also add the remark to the student's record
    student_id = appointment.get("student_id")
    if student_id:
        # Create a remark object similar to the one in add_remark function
        student_remark = {
            "text": remark,
            "date": remark_date,
            "counselor": current_user_email,
            "counselor_name": f"{counselor['lastname']}, {counselor['firstname']}",
            "appointment_id": str(appointment_id)  # Link to the appointment
        }
        
        # Update the student record
        students_collection.update_one(
            {"_id": ObjectId(student_id)},
            {
                "$push": {"remarks": student_remark},
                "$set": {"counselingDone": True, "sentToAdmin": True}
            }
        )
    
    return jsonify({"message": "Remarks added successfully"}), 200

@app.route('/counselor/student/<student_id>', methods=['DELETE'])
@jwt_required()
def delete_student(student_id): 
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403
        
    try:
        result = students_collection.delete_one({
            "_id": ObjectId(student_id),
            "counselor_email": current_user_email
        })
        
        if result.deleted_count == 0:
            return jsonify({"message": "Student not found or unauthorized"}), 404
            
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route('/counselor/student/<student_id>', methods=['DELETE'])
@jwt_required()
def counselor_delete_student(student_id):  
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403
        
    try:
        result = students_collection.delete_one({
            "_id": ObjectId(student_id),
            "counselor_email": current_user_email
        })
        
        if result.deleted_count == 0:
            return jsonify({"message": "Student not found or unauthorized"}), 404
            
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# GET route to fetch a single student by ID
@app.route('/counselor/student/<student_id>', methods=['GET'])
@jwt_required()
def get_student(student_id):
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403
        
    try:
        # Get the student by ID
        student = students_collection.find_one({"_id": ObjectId(student_id)})
        
        if not student:
            return jsonify({"message": "Student not found"}), 404
            
        # Check if counselor has assignments
        assignments = counselor.get('assignments', [])
        
        # If counselor has no assignments, they can't access any students
        if not assignments:
            return jsonify({"message": "No assignments configured for this counselor"}), 403
            
        # Check if student matches any of the counselor's assignments
        has_access = False
        for assignment in assignments:
            assignment_type = assignment.get('type')
            value = assignment.get('value')
            
            if assignment_type == 'course' and student.get('level') == 'HED' and student.get('course') == value:
                has_access = True
                break
            elif assignment_type == 'year' and student.get('level') == 'BED' and student.get('year') == value:
                has_access = True
                break
        
        if not has_access:
            return jsonify({"message": "You don't have access to this student"}), 403
            
        # Convert ObjectId to string for JSON serialization
        student['_id'] = str(student['_id'])
        
        # Remove password before sending
        if 'password' in student:
            del student['password']
            
        return jsonify({"student": student}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# GET route to fetch a single student by ID for admin
@app.route('/admin/student/<student_id>', methods=['GET'])
@jwt_required()
def admin_get_student(student_id):
    current_user_email = get_jwt_identity()
    admin = admins_collection.find_one({"email": current_user_email})
    
    if not admin:
        return jsonify({"message": "Unauthorized"}), 403
        
    try:
        student = students_collection.find_one({
            "_id": ObjectId(student_id)
        })
        
        if not student:
            return jsonify({"message": "Student not found"}), 404
            
        # Convert ObjectId to string for JSON serialization
        student['_id'] = str(student['_id'])
        
        # Remove password before sending
        if 'password' in student:
            del student['password']
            
        return jsonify({"student": student}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500


# PUT route to update a student 
@app.route('/counselor/student/<student_id>', methods=['PUT']) 
@jwt_required() 
def update_student(student_id): 
    current_user_email = get_jwt_identity() 
    counselor = counselors_collection.find_one({"email": current_user_email}) 
    
    if not counselor: 
        return jsonify({"message": "Unauthorized"}), 403 
        
    try: 
        data = request.get_json() 
        
        # Find the student first 
        student = students_collection.find_one({"_id": ObjectId(student_id)}) 
        
        if not student: 
            return jsonify({"message": "Student not found"}), 404 
            
        # Check if counselor has assignments 
        assignments = counselor.get('assignments', []) 
        
        # If counselor has no assignments, they can't access any students 
        if not assignments: 
            return jsonify({"message": "No assignments configured for this counselor"}), 403 
            
        # Check if student matches any of the counselor's assignments 
        has_access = False 
        for assignment in assignments: 
            assignment_type = assignment.get('type') 
            value = assignment.get('value') 
            
            if assignment_type == 'course' and student.get('level') == 'HED' and student.get('course') == value: 
                has_access = True 
                break 
            elif assignment_type == 'year' and student.get('level') == 'BED' and student.get('year') == value: 
                has_access = True 
                break 
        
        if not has_access: 
            return jsonify({"message": "You don't have access to this student"}), 403 
        
        # Update the student data 
        update_data = {} 
        for key, value in data.items(): 
            if key != '_id' and key != 'password':  # Don't update ID or password 
                update_data[key] = value
        
        # Handle level transition from BED to HED
        if 'level' in update_data and update_data['level'] == 'HED' and student['level'] == 'BED':
            # Set BED-specific fields to null when transitioning to HED
            update_data["year"] = None
            update_data["section"] = None
            
            # Make sure course is set for HED students
            if 'course' not in update_data:
                return jsonify({"message": "Course is required for HED students"}), 400
        
        # Handle level transition from HED to BED (if ever needed)
        elif 'level' in update_data and update_data['level'] == 'BED' and student['level'] == 'HED':
            # Set HED-specific fields to null when transitioning to BED
            update_data["course"] = None
            
            # Make sure year and section are set for BED students
            if 'year' not in update_data or 'section' not in update_data:
                return jsonify({"message": "Year and section are required for BED students"}), 400
                
        students_collection.update_one( 
            {"_id": ObjectId(student_id)}, 
            {"$set": update_data} 
        ) 
        
        return jsonify({"message": "Student updated successfully"}), 200 
    except Exception as e: 
        return jsonify({"message": str(e)}), 500

# Add a new endpoint for admin to add remarks to students
@app.route('/admin/students/<student_id>/remarks', methods=['POST'])
@jwt_required()
def admin_add_remark(student_id):
    current_user_email = get_jwt_identity()
    admin = admins_collection.find_one({"email": current_user_email})
    if not admin:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    remark_text = data.get("text")
    counselor_id = data.get("counselor_id")
    
    if not remark_text or not counselor_id:
        return jsonify({"message": "Remark text and counselor ID required"}), 400
    
    # Get counselor information
    counselor = counselors_collection.find_one({"_id": ObjectId(counselor_id)})
    if not counselor:
        return jsonify({"message": "Counselor not found"}), 404

    # Format: April 23, 2025 and 2:00 PM
    remark_date = datetime.now(pytz.timezone("Asia/Manila")).strftime("%B %d, %Y and %I:%M %p")

    remark = {
        "text": remark_text,
        "date": remark_date,
        "counselor": counselor_id,
        "counselor_name": f"{counselor['lastname']}, {counselor['firstname']}"
    }

    result = students_collection.update_one(
        {"_id": ObjectId(student_id)},
        {"$push": {"remarks": remark}}
    )

    if result.matched_count == 0:
        return jsonify({"message": "Student not found"}), 404

    return jsonify({"message": "Remark added successfully."}), 200

# Add endpoint for admin to edit remarks
@app.route('/admin/students/<student_id>/remarks/<int:remark_idx>', methods=['PUT'])
@jwt_required()
def admin_update_remark(student_id, remark_idx):
    current_user_email = get_jwt_identity()
    admin = admins_collection.find_one({"email": current_user_email})
    if not admin:
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json()
    new_text = data.get("text")
    if not new_text:
        return jsonify({"message": "Remark text required"}), 400

    # Find the student
    student = students_collection.find_one({"_id": ObjectId(student_id)})
    if not student:
        return jsonify({"message": "Student not found"}), 404

    # Check if the remark index is valid
    if "remarks" not in student or remark_idx < 0 or remark_idx >= len(student["remarks"]):
        return jsonify({"message": "Remark not found"}), 404

    # Update the remark text and date
    updated_date = datetime.now(pytz.timezone("Asia/Manila")).strftime("%B %d, %Y and %I:%M %p")
    update_fields = {
        f"remarks.{remark_idx}.text": new_text,
        f"remarks.{remark_idx}.date": updated_date,
    }
    
    students_collection.update_one(
        {"_id": ObjectId(student_id)},
        {"$set": update_fields}
    )

    return jsonify({"message": "Remark updated successfully."}), 200

# Student login route
@app.route('/student/login', methods=['POST'])
def student_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400
    
    student = students_collection.find_one({'email': email})
    if not student:
        return jsonify({'error': 'Invalid email or password.'}), 401
    
    if not verify_password(password, student['password']):
        return jsonify({'error': 'Invalid email or password.'}), 401
    
    # Create JWT token for student
    access_token = create_access_token(identity=email, additional_claims={'role': 'student'})
    
    return jsonify({
        'access_token': access_token,
        'role': 'student',
        'student_id': str(student['_id'])
    }), 200

# Student get profile info
@app.route('/student/profile', methods=['GET'])
@jwt_required()
def get_student_profile():
    current_user_email = get_jwt_identity()
    student = students_collection.find_one({"email": current_user_email}, {"password": 0})

    if not student:
        return jsonify({"message": "Student not found"}), 404

    student['_id'] = str(student['_id'])
    return jsonify({"student": student}), 200

# Get student counseling history
@app.route('/student/counseling-history', methods=['GET'])
@jwt_required()
def get_student_counseling_history():
    current_user_email = get_jwt_identity()
    student = students_collection.find_one({'email': current_user_email})
    
    if not student:
        return jsonify({'error': 'Student not found.'}), 404
    
    # Extract counseling remarks with dates and counselor info
    counseling_history = []
    if 'remarks' in student:
        counseling_history = student['remarks']
    
    return jsonify({'counseling_history': counseling_history}), 200

# Add this function before you use it in get_all_students
def make_json_serializable(obj):
    if isinstance(obj, bytes):
        return obj.decode('utf-8', errors='replace')
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_serializable(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.strftime("%Y-%m-%d %H:%M:%S")
    else:
        return obj

@app.route('/counselor/student/<student_id>/send-to-admin', methods=['PUT'])
@jwt_required()
def send_student_to_admin(student_id):
    current_user_email = get_jwt_identity()
    counselor = counselors_collection.find_one({"email": current_user_email})
    
    if not counselor:
        return jsonify({"message": "Unauthorized"}), 403
    
    try:
        # Find the student first to check if it exists and belongs to this counselor
        student = students_collection.find_one({
            "_id": ObjectId(student_id),
            "counselor_email": current_user_email
        })
        
        if not student:
            return jsonify({"message": "Student not found or unauthorized"}), 404
        
        # Update the student's counselingDone status
        result = students_collection.update_one(
            {"_id": ObjectId(student_id), "counselor_email": current_user_email},
            {"$set": {"counselingDone": True}}
        )
        
        if result.matched_count == 0:
            return jsonify({"message": "Student not found or unauthorized"}), 404
            
        return jsonify({"message": "Student successfully sent to admin"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()

    # Validate required fields
    email = data.get('email')
    password = data.get('password')
    firstname = data.get('firstname')
    lastname = data.get('lastname')
    level = data.get('level')
    phone_no = data.get('phone_no')
    student_no = data.get('student_no')

    # Ensure required fields are provided
    if not email or not password or not firstname or not lastname or not level or not phone_no or not student_no:
        return jsonify({'error': 'Email, password, firstname, lastname, and level are required.'}), 400

    # Check if student email already exists
    if students_collection.find_one({'email': email}):
        return jsonify({'error': 'Email already exists.'}), 400
    
     # Check if student number already exists
    if students_collection.find_one({'student_no': student_no}):
        return jsonify({'error': 'Student number already exists.'}), 400
    
     # Validate student number format (e.g., "22-01116")
    if not re.match(r'^\d{2}-\d{5}$', student_no):
        return jsonify({'error': 'Invalid student number format. Must be in the format XX-XXXXX (e.g., 22-01116).'}), 400

    # Validate email domain
    if not email.endswith('@shc.edu.ph'):
        return jsonify({'error': 'Please use your school email address (@shc.edu.ph)'}), 400
    
    # Hash password
    hashed_pw = hash_password(password)

    # Set up student account data
    student_account = {
        'email': email,
        'password': hashed_pw,
        'firstname': firstname,
        'lastname': lastname,
        'gender': None,
        'phone_no': phone_no,
        'student_no': student_no,
        'address': None,
        'dob': None,
        'created_at': datetime.now(pytz.timezone("Asia/Manila")).strftime("%Y-%m-%d %H:%M:%S"),
        'counselor_email': None,  # No counselor assigned yet
        'level': level,
        'counselingDone': True,   # Mark as done automatically
        'sentToAdmin': True,      # Send to admin automatically
        'remarks': []             # Initialize empty remarks array
    }

    # Add fields based on level
    if level == "HED":
        student_account['course'] = data.get('course')
        student_account['year'] = None
        student_account['section'] = None
    elif level == "BED":
        student_account['course'] = None
        student_account['year'] = data.get('year')
        student_account['section'] = data.get('section')
    else:
        student_account['course'] = None
        student_account['year'] = None
        student_account['section'] = None

    students_collection.insert_one(student_account)

    return jsonify({"message": "Student account created successfully."}), 201

# Get student's appointments
@app.route('/student/my-appointments', methods=['GET'])
@jwt_required()
def get_student_appointments():
    current_user_email = get_jwt_identity()
    student = students_collection.find_one({"email": current_user_email})
    
    if not student:
        return jsonify({"message": "Student not found"}), 404
    
    # Get appointments
    appointments = []
    for appointment in appointments_collection.find({"student_email": current_user_email}).sort("created_at", -1):
        appointment['_id'] = str(appointment['_id'])
        appointments.append(appointment)
    
    return jsonify({"appointments": appointments}), 200

# Get student's counseling schedules
@app.route('/student/counseling-schedules', methods=['GET'])
@jwt_required()
def get_student_counseling_schedules():
    try:
        # Get the current student
        current_user_email = get_jwt_identity()
        student = students_collection.find_one({"email": current_user_email})
        
        if not student:
            return jsonify({"message": "Student not found"}), 404
        
        # Find all appointments for this student
        appointments = appointments_collection.find({
            "student_email": current_user_email,
            "status": {"$in": ["approved", "pending"]}
        })
        
        # Format the appointments for the frontend
        schedules = []
        for appointment in appointments:
            schedules.append({
                "_id": str(appointment["_id"]),
                "appointment_date": appointment["appointment_date"],
                "appointment_time": appointment["appointment_time"],
                "reason": appointment["reason"],
                "counselor_name": appointment["counselor_name"],
                "status": appointment["status"]
            })
        
        return jsonify({"schedules": schedules}), 200
    
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route('/admin/dashboard-stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    current_user_email = get_jwt_identity()
    admin = admins_collection.find_one({"email": current_user_email})
    
    if not admin:
        return jsonify({"message": "Unauthorized"}), 403
    
    try:
        # Get total counts
        total_students = students_collection.count_documents({})
        total_counselors = counselors_collection.count_documents({})
        total_bed_students = students_collection.count_documents({"level": "BED"})
        total_hed_students = students_collection.count_documents({"level": "HED"})
        
        return jsonify({
            "total_students": total_students,
            "total_counselors": total_counselors,
            "total_bed_students": total_bed_students,
            "total_hed_students": total_hed_students
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# Create bulk appointments for multiple students
@app.route('/counselor/bulk-schedule', methods=['POST'])
@jwt_required()
def create_bulk_schedule():
    try:
        # Get the current counselor
        current_user_email = get_jwt_identity()
        counselor = counselors_collection.find_one({"email": current_user_email})
        
        if not counselor:
            return jsonify({"message": "Unauthorized"}), 403
        
        # Get request data
        data = request.get_json()
        student_ids = data.get('studentIds', [])
        appointment_date = data.get('appointmentDate')
        appointment_time = data.get('appointmentTime')
        reason = data.get('reason')
        
        # Validate input
        if not student_ids or not appointment_date or not appointment_time or not reason:
            return jsonify({"message": "Missing required fields"}), 400
        
        # Format counselor name
        counselor_name = f"{counselor['firstname']} {counselor['lastname']}"
        counselor_id = str(counselor['_id'])
        
        # Create appointments for each student
        successful_appointments = 0
        failed_appointments = 0
        
        for student_id in student_ids:
            try:
                # Find the student
                student = students_collection.find_one({"_id": ObjectId(student_id)})
                if not student:
                    failed_appointments += 1
                    continue
                
                # Format student name
                student_name = f"{student['firstname']} {student['lastname']}"
                
                # Create the appointment
                appointment = {
                    "student_id": student_id,
                    "student_name": student_name,
                    "student_email": student['email'],
                    "counselor_id": counselor_id,
                    "counselor_name": counselor_name,
                    "appointment_date": appointment_date,
                    "appointment_time": appointment_time,
                    "reason": reason,
                    "status": "approved",  # Auto-approve since counselor created it
                    "created_at": datetime.now(pytz.timezone("Asia/Manila")).strftime("%Y-%m-%d %H:%M:%S")
                }
                
                appointments_collection.insert_one(appointment)
                successful_appointments += 1
                
            except Exception as e:
                print(f"Error creating appointment for student {student_id}: {str(e)}")
                failed_appointments += 1
        
        return jsonify({
            "message": f"Successfully scheduled {successful_appointments} appointments. {failed_appointments} failed.",
            "successful": successful_appointments,
            "failed": failed_appointments
        }), 201
    
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)