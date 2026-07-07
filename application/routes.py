from .database import db
from .models import *
from flask import current_app as app, jsonify, request, render_template,send_from_directory

from flask_security import auth_required, roles_required, current_user, hash_password, logout_user
from flask_security.utils import verify_password
from flask_login import login_user
from celery.result import AsyncResult
from .tasks import download_quiz_report


@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')


@app.route('/api/admin')
@auth_required('token')
@roles_required('admin')
def admin_home():
    admin = current_user
    return jsonify({
        "username": admin.username,
        "email": admin.email,
        "role": "admin", 
        "message": "Admin login successful"
    })


@app.route('/api/user')
@auth_required('token')
def user_home():
    user = current_user
    roles = [role.name for role in user.roles]  

    return jsonify({
        "id":user.id,
        "username": user.username,
        "email": user.email,
        "role": "admin" if "admin" in roles else "user"  
    })


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    required_fields = ["email", "username", "password", "qualification"]

    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required fields!"}), 400

    if not app.security.datastore.find_user(email=data["email"]):
        app.security.datastore.create_user(
            email=data["email"],
            username=data["username"],
            password=hash_password(data["password"]),
            qualification=data["qualification"],
            roles=['user'] 
        )
        db.session.commit()
        return jsonify({"message": "User created successfully"}), 201

    return jsonify({"message": "User already exists"}), 400


@app.route('/api/login', methods=['POST'])
def user_login():
    body = request.get_json()
    email = body.get('email')
    password = body.get('password')

    if not email or not password:
        return jsonify({"message": "Email and Password are required!"}), 400

    user = app.security.datastore.find_user(email=email)

    if not user:
        return jsonify({"message": "User Not Found!"}), 404

    print(f"User Found: {user.email}")  

    if verify_password(password, user.password): 
        login_user(user)
        token = user.get_auth_token() if hasattr(user, "get_auth_token") else "token_not_available"
        roles = [role.name for role in user.roles]

        return jsonify({
            "id": user.id,
            "username": user.username,
            "auth-token": token,
            "roles": roles  
        }), 200
    else:
        return jsonify({"message": "Incorrect Password"}), 400


@app.route('/api/logout', methods=['POST'])
@auth_required('token')
def logout():
    logout_user()
    return jsonify({"message": "Logout successful"}), 200

@app.route('/api/export/<int:user_id>')
def export_csv(user_id):
    result = download_quiz_report.delay(user_id)
    return jsonify({
        "id":result.id,
        "result" : result.result,
        }), 200

@app.route('/api/csv_result/<id>')
def get_csv_result(id):
    result = AsyncResult(id)
    print(f"Task ID: {id}")  
    print(f"Task State: {result.state}")  
    print(f"Task Result: {result.result}")  
    if result.state != "SUCCESS":
        return jsonify({"error": "Task not completed yet"}), 202  
    
    if not result.result:
        return jsonify({"error": "CSV file not found"}), 404  
    
    return send_from_directory("static",result.result)
    