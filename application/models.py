from .database import db
from flask_security import UserMixin,RoleMixin
from datetime import datetime,timezone

class User(db.Model,UserMixin):
    id = db.Column(db.Integer,primary_key = True)
    email = db.Column(db.String,unique = True,nullable = False)
    password = db.Column(db.String(600), nullable=False)
    username = db.Column(db.String(100),nullable = False)
    fs_uniquifier = db.Column(db.String(100), nullable=False, unique = True)
    qualification = db.Column(db.String(255))
    roles = db.relationship('Role',backref = 'bearer', secondary = 'user_roles')
    active = db.Column(db.Boolean(), default=True)
    subjects = db.relationship('Subject',backref = "user",lazy=True,cascade = "all,delete")
    scores = db.relationship('Score', backref='user', lazy=True, cascade="all, delete")


class Role(db.Model,RoleMixin):
    id = db.Column(db.Integer,primary_key = True)
    name = db.Column(db.String(100),nullable = False,unique = True)
    description = db.Column(db.String(100),nullable = False)

class UserRoles(db.Model):
    # id = db.Column(db.Integer,primary_key = True,autoincrement=True)
    user_id = db.Column(db.Integer,db.ForeignKey('user.id'),primary_key=True)
    role_id = db.Column(db.Integer,db.ForeignKey('role.id'),primary_key=True)

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    chapters = db.relationship('Chapter', backref='subject', lazy=True, cascade="all, delete")
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    quizzes = db.relationship('Quiz', backref='chapter', lazy=True, cascade="all, delete")


class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'), nullable=False)
    date_of_quiz = db.Column(db.String, default=datetime.now(timezone.utc))
    time_duration = db.Column(db.String(5))  
    remarks = db.Column(db.Text)

    questions = db.relationship('Question', backref='quiz', lazy=True, cascade="all, delete")
    scores = db.relationship('Score', backref='quiz', lazy=True, cascade="all, delete")

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question_statement = db.Column(db.Text, nullable=False)
    option1 = db.Column(db.String(255), nullable=False)
    option2 = db.Column(db.String(255), nullable=False)
    option3 = db.Column(db.String(255), nullable=False)
    option4 = db.Column(db.String(255), nullable=False)
    correct_option = db.Column(db.Integer, nullable=False)  

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    total_scored = db.Column(db.Integer, nullable=False)
