 QuizMaster-Mad2
Project for mad 2 
 Quiz Master - V2

 Overview
Quiz Master - V2 is a multi-user exam preparation platform designed for administering quizzes with admin and user roles. 

 Features
 Admin (Quiz Master)
- Create subjects, chapters, quizzes, and questions.
- Manage users, search subjects/quizzes, and view summary charts.
- Edit/delete quizzes and set quiz duration.
- Trigger batch jobs like CSV exports.

 User
- Register/Login and attempt quizzes.
- View past attempts and summary charts.
- Take quizzes with a timer and receive instant feedback.
- Quiz scores are stored and analyzed.

 Tech Stack
 Backend:
- Flask (API Development)
- SQLite (Database, no other DB allowed)
- Redis (Caching and async tasks)
- Celery (Background job processing)
- Flask Security (RBAC using JWT-based authentication)

 Frontend:
- Vue.js (User Interface)
- Bootstrap (Styling)
- Jinja2 (Only for CDN-based entry point)

 Installation
 Prerequisites
- Python 3.x
- Redis Server


 Backend Setup

1. Create a virtual environment:
   python -m venv venv
   source .env/bin/activate   On Windows use .env\Scripts\activate
   
3. Install dependencies:
   pip install -r requirements.txt
   
4. Run Redis:
   redis-server
   
5. Start the app:
   python app.py
   


 Batch Jobs
- Daily Reminders: Notifies users about pending quizzes.
- Monthly Reports: Generates quiz performance summaries.
- CSV Export: Admin-triggered export of quiz records.
