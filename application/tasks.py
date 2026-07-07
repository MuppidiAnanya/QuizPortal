from celery import shared_task
from .models import *
import csv
from datetime import datetime
from .utils import format_report
from .mail import send_email
import requests



@shared_task(ignore_results = False, name = "download_quiz_report")
def download_quiz_report(user_id):
    user = User.query.get(user_id)
    attempts = Score.query.filter_by(user_id=user_id).all()
    csv_file_name = f"Quiz_{datetime.now().strftime('%f')}.csv"
    with open(f'static/{csv_file_name}', "w", newline='') as csvfile:
        s_no  =1
        quiz_csv = csv.writer(csvfile,delimiter=',')
        quiz_csv.writerow(["Quiz ID","Quiz Name","Score","Attempt_date"])
        for attempt in attempts:
            quiz_csv.writerow([attempt.quiz_id,attempt.quiz.remarks,attempt.total_scored,attempt.timestamp
                               ])
            s_no+=1
    return csv_file_name



@shared_task(ignore_results = False, name = "quiz_reminder")
def quiz_reminder(username):
    msg = f"Hello Users, a new Quiz has been added by the {username}! Please check the app at http://127.0.0.1:5000/#/login "
    response = requests.post("https://chat.googleapis.com",headers={'Content-type':'application/json'},json={"text":msg})
    return "Update has been sent to user"



@shared_task(ignore_results = False, name = "send_performace_report")
def send_performace_report():
    users = User.query.all()
    for user in users:
        userdata = {}
        userdata['username'] = user.username
        userdata['email'] = user.email
        attempts = []
        for attempt in Score.query.filter_by(user_id=user.id).all():
            attempts.append({
                'quiz_id': attempt.quiz_id,
                'quiz_name': attempt.quiz.remarks,
                'score': attempt.total_scored,
                'attempt_date': attempt.timestamp
                })
        userdata['attempts'] = attempts
        msg = format_report('templates/mail_details.html',userdata)
        send_email(user.email, subject = "Monthly Activity Report of Quizzes", message=msg)
    return "sending performace report"
