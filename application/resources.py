from flask_restful import Api,Resource,reqparse
from .models import *
from flask_security import auth_required,roles_required,current_user,roles_accepted
from flask import current_app as app,jsonify,request
from datetime import datetime
from sqlalchemy import text
from .tasks import quiz_reminder




api = Api()
parser  = reqparse.RequestParser()


def roles_list(roles):
    roles_list = []
    for role in roles:
        roles_list.append(role.name)
    return roles_list
class UsersViewAPI(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        users = User.query.all()
        user_list = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,

            }
            for user in users if "admin" not in [role.name for role in user.roles]
        ]
        return jsonify(user_list)


api.add_resource(UsersViewAPI, "/api/admin/users")

class SubApi(Resource):
    @auth_required("token")
    @roles_accepted('user','admin')
    def get(self):
        subjects = []
        subjects_json = []
        if "admin" in roles_list(current_user.roles):
            subjects = Subject.query.all()
        else:
            subjects = current_user.subjects
        for subject in subjects:
            this_subj = {}
            this_subj['id'] = subject.id
            this_subj['name'] = subject.name
            this_subj['description'] = subject.description
            this_subj['created_at'] = subject.created_at
            subjects_json.append(this_subj)
        if subjects_json:
            return jsonify(subjects_json) or []
       
    
    @auth_required("token")
    @roles_required("admin")
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("name", type=str, required=True, help="Subject name is required")
        parser.add_argument("description", type=str)
        args = parser.parse_args()


        if Subject.query.filter_by(name=args["name"]).first():
            return {"message": "Subject already exists"}, 400

        new_subject = Subject(name=args["name"], description=args["description"],user_id = current_user.id)
        db.session.add(new_subject)
        db.session.commit()
        
        return {"message": "Subject created successfully", "id": new_subject.id}, 201

   
    @auth_required("token")
    @roles_required("admin")
    def put(self, id):
        parser = reqparse.RequestParser()
        parser.add_argument("name", type=str)
        parser.add_argument("description", type=str)
        args = parser.parse_args()

        subject = Subject.query.get(id)
        if not subject:
            return {"message": "Subject not found"}, 404

        if args["name"]:
            subject.name = args["name"]
        if args["description"]:
            subject.description = args["description"]

        db.session.commit()
        return {"message": "Subject updated successfully"}

    @auth_required("token")
    @roles_required("admin")
    def delete(self, id):
        subject = Subject.query.get(id)
        if not subject:
            return {"message": "Subject not found"}, 404

        db.session.delete(subject)
        db.session.commit()
        return {"message": "Subject deleted successfully"}
    
api.add_resource(SubApi,'/api/subjects','/api/subjects/<int:id>')


class ChapterApi(Resource):
    @auth_required("token")
    @roles_accepted("user", "admin")
    def get(self, subject_id=None, chapter_id=None):
        if chapter_id:
            chapter = Chapter.query.get(chapter_id)
            if not chapter:
                return {"message": "Chapter not found"}, 404
            return {"id": chapter.id, "name": chapter.name, "description": chapter.description}, 200

        if subject_id:
            subject = Subject.query.get(subject_id)
            if not subject:
                return {"message": "Subject not found"}, 404

            if "admin" in roles_list(current_user.roles) or subject in current_user.subjects:
                chapters = Chapter.query.filter_by(subject_id=subject_id).all()
                chapters_json = [{"id": c.id, "name": c.name, "description": c.description} for c in chapters]
                return chapters_json if chapters_json else {"message": "No chapters found"}, 200
        
        return {"message": "Invalid request"}, 400
    
    @auth_required("token")
    @roles_required("admin")
    def post(self, subject_id):

        subject = Subject.query.get(subject_id)
        if not subject:
            return {"message": "Subject not found"}, 404

        parser = reqparse.RequestParser()
        parser.add_argument("name", type=str, required=True, help="Chapter name is required")
        parser.add_argument("description", type=str)
        args = parser.parse_args()

        new_chapter = Chapter(name=args["name"], description=args["description"], subject_id=subject_id)
        db.session.add(new_chapter)
        db.session.commit()
        
        return {"message": "Chapter created successfully", "id": new_chapter.id}, 201

    @auth_required("token")
    @roles_required("admin")
    def put(self, chapter_id):
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return {"message": "Chapter not found"}, 404

        parser = reqparse.RequestParser()
        parser.add_argument("name", type=str)
        parser.add_argument("description", type=str)
        args = parser.parse_args()

        if args["name"]:
            chapter.name = args["name"]
        if args["description"]:
            chapter.description = args["description"]

        db.session.commit()
        return {"message": "Chapter updated successfully"}

    @auth_required("token")
    @roles_required("admin")
    def delete(self, chapter_id):
        chapter = Chapter.query.get(chapter_id)
        if not chapter:
            return {"message": "Chapter not found"}, 404

        db.session.delete(chapter)
        db.session.commit()
        return {"message": "Chapter deleted successfully"}


api.add_resource(ChapterApi, "/api/subjects/<int:subject_id>/chapters", "/api/chapters/<int:chapter_id>")

class QuizAPI(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument("chapter_id", type=int, required=True, help="Chapter ID is required")
    parser.add_argument("date_of_quiz", type=str, required=True, help="Date of quiz is required (YYYY-MM-DD HH:MM)")
    parser.add_argument("time_duration", type=str, required=True, help="Time duration required (HH:MM)")
    parser.add_argument("remarks", type=str)

    @auth_required("token")
    @roles_accepted("admin","user")
    def get(self):
        try:
            quizzes = Quiz.query.all()
            return [{
                "id": quiz.id,
                 "num_questions": Question.query.filter_by(quiz_id=quiz.id).count(),
                 "subject":quiz.chapter.subject.name,
                "chapter_id": quiz.chapter_id,
                "date_of_quiz": quiz.date_of_quiz,
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks
            } for quiz in quizzes], 200  
        except Exception as e:
            return {"error": str(e)}, 500  
  

    @auth_required("token")
    @roles_required("admin")
    def post(self):
        args = self.parser.parse_args()

        chapter = Chapter.query.get(args["chapter_id"])
        if not chapter:
            return {"message": "Chapter not found"}, 404

        try:
            quiz = Quiz(
                # id = args["id"],
                chapter_id=args["chapter_id"],
                date_of_quiz=(args["date_of_quiz"]),
                time_duration=args["time_duration"],
                remarks=args["remarks"]
            )
            db.session.add(quiz)
            db.session.commit()
            result = quiz_reminder.delay(quiz.chapter.subject.user.username)
            return {"message": "Quiz created successfully", "quiz_id": quiz.id, "chapter_id": quiz.chapter_id}, 201
        except Exception as e:
            return {"message": "Error creating quiz", "error": str(e)}, 500

    @auth_required("token")
    @roles_required("admin")
    def put(self, quiz_id):
        args = self.parser.parse_args()

        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        if args["chapter_id"]:
            chapter = Chapter.query.get(args["chapter_id"])
            if not chapter:
                return {"message": "Chapter not found"}, 404
            quiz.chapter_id = args["chapter_id"]

        if args["date_of_quiz"]:
            quiz.date_of_quiz = (args["date_of_quiz"])
        if args["time_duration"]:
            quiz.time_duration = args["time_duration"]
        if args["remarks"]:
            quiz.remarks = args["remarks"]

        db.session.commit()
        return {"message": "Quiz updated successfully"}

    @auth_required("token")
    @roles_required("admin")
    def delete(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        db.session.delete(quiz)
        db.session.commit()
        return {"message": "Quiz deleted successfully"}




api.add_resource(QuizAPI, "/api/admin/quiz", "/api/admin/quiz/<int:quiz_id>")


class QuestionAPI(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument("question_statement", type=str, required=True, help="Question is required")
    parser.add_argument("option1", type=str, required=True, help="Option 1 is required")
    parser.add_argument("option2", type=str, required=True, help="Option 2 is required")
    parser.add_argument("option3", type=str, required=True, help="Option 3 is required")
    parser.add_argument("option4", type=str, required=True, help="Option 4 is required")
    parser.add_argument("correct_option", type=int, required=True, help="Correct option is required (1-4)")

    @auth_required("token")
    @roles_required("admin")
    def post(self, quiz_id):
        args = self.parser.parse_args()
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        question = Question(
            quiz_id=quiz_id,
            question_statement=args["question_statement"],
            option1=args["option1"],
            option2=args["option2"],
            option3=args["option3"],
            option4=args["option4"],
            correct_option=args["correct_option"]
        )
        db.session.add(question)
        db.session.commit()
        return {"message": "Question added successfully", "question_id": question.id}, 201
    
    @auth_required("token")
    @roles_accepted("admin","user")
    def get(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        if not questions:
            return [], 200

        return [{
            "id": q.id,
            "question_statement": q.question_statement,
            "options": [q.option1, q.option2, q.option3, q.option4],
            "correct_option": q.correct_option
        } for q in questions], 200
    
    @auth_required("token")
    @roles_required("admin")
    def put(self, question_id):
        question = Question.query.get(question_id)
        if not question:
            return {"message": "Question not found"}, 404

        args = self.parser.parse_args()
        if args["question_statement"]:
            question.question_statement = args["question_statement"]
        if args["option1"]:
            question.option1 = args["option1"]
        if args["option2"]:
            question.option2 = args["option2"]
        if args["option3"]:
            question.option3 = args["option3"]
        if args["option4"]:
            question.option4 = args["option4"]
        if args["correct_option"] in range(1, 5):
            question.correct_option = args["correct_option"]

        db.session.commit()
        return {"message": "Question updated successfully"}

    @auth_required("token")
    @roles_required("admin")
    def delete(self, question_id):
        question = Question.query.get(question_id)
        if not question:
            return {"message": "Question not found"}, 404

        db.session.delete(question)
        db.session.commit()
        return {"message": "Question deleted successfully"}

api.add_resource(QuestionAPI, "/api/admin/quiz/<int:quiz_id>/questions", "/api/admin/question/<int:question_id>")




class QuizDetailAPI(Resource):
    @auth_required("token")
    @roles_accepted("admin", "user")
    def get(self, quiz_id):
        try:
            quiz = Quiz.query.get(quiz_id)
            if not quiz:
                return {"error": "Quiz not found"}, 404
            chapter = quiz.chapter
            subject = chapter.subject if chapter else None
            num_questions = len(quiz.questions)

            return {
                "id": quiz.id,
                "subject": subject.name if subject else "N/A",  
                "chapter": chapter.name if chapter else "N/A",  
                "num_questions": num_questions,
                "date_of_quiz": quiz.date_of_quiz,
                "time_duration": quiz.time_duration
            }, 200
        except Exception as e:
            return {"error": str(e)}, 500

api.add_resource(QuizDetailAPI, "/api/quiz/<int:quiz_id>/details")


class FetchQuizQuestions(Resource):
    @auth_required()
    def get(self, quiz_id):
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        if not questions:
            return {"message": "No questions found for this quiz"}, 404

        return {
            "quiz_id": quiz_id,
            "questions": [
                {
                    "id": q.id,
                    "question_statement": q.question_statement,
                    "options": [q.option1, q.option2, q.option3, q.option4]
                }
                for q in questions
            ]
        }, 200


class SubmitQuizAttempt(Resource):
    @auth_required()
    def post(self, quiz_id):
        data = request.get_json()

        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        if "results" not in data or not isinstance(data["results"], list):
            return {"message": "Invalid request format"}, 400

        score = 0
        total_questions = len(data["results"])

        for result in data["results"]:
            question = Question.query.get(result["question_id"])
            if not question:
                continue  

            options = [question.option1, question.option2, question.option3, question.option4]  


            if not (1 <= question.correct_option <= 4):
                print(f"Invalid correct_option value for Q{question.id}: {question.correct_option}")
                continue  

            correct_option_text = options[question.correct_option - 1]  
            selected_option = result.get("selected_option")

            if selected_option in options:
                selected_index = options.index(selected_option) + 1  
            else:
                print(f"Invalid selected_option for Q{question.id}: {selected_option}")
                continue  

            print(f"Checking Q{result['question_id']}: Selected {selected_index} vs Correct {question.correct_option}")  

            if selected_index == question.correct_option:
                score += 1  

        new_attempt = Score(user_id=current_user.id, quiz_id=quiz_id, total_scored=score)

        db.session.add(new_attempt)
        db.session.commit()
        print("Attempt saved successfully.")  

        print(f"Final Score: {score}")  

        return {
            "quiz_id": quiz_id,
            "user_id": current_user.id,
            "score": score,
            "total_questions": total_questions
        }, 201


api.add_resource(FetchQuizQuestions, "/api/quiz/<int:quiz_id>/questions")
api.add_resource(SubmitQuizAttempt, "/api/quiz/<int:quiz_id>/submit")


class UserQuizAttempts(Resource):
    @auth_required()
    def get(self):
        attempts = (
            db.session.query(Score, Quiz)
            .join(Quiz, Score.quiz_id == Quiz.id)
            .filter(Score.user_id == current_user.id)
            .order_by(Score.timestamp.desc())   
            .all()
        )

        attempt_list = []
        for score, quiz in attempts:
            attempt_list.append({
                "quiz_id": quiz.id,
                "quiz_name": f"Quiz {quiz.id}",
                "score": score.total_scored,
                "timestamp": score.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })

        return jsonify({"attempts": attempt_list})
api.add_resource(UserQuizAttempts, "/api/user/quiz-attempts")


class QuizSummaryAPI(Resource):
    @auth_required("token")
    def get(self):
        user_id = current_user.id  

        attempts = Score.query.filter_by(user_id=user_id).all()

        if not attempts:
            return jsonify({"average_percentage": 0, "quiz_attempt_count": 0})

        total_score = 0
        total_questions = 0
        attempt_count = len(attempts)

        for attempt in attempts:
            quiz = Quiz.query.get(attempt.quiz_id)
            if quiz:
                num_questions = len(Question.query.filter_by(quiz_id=quiz.id).all())
                total_score += attempt.total_scored
                total_questions += num_questions
        average_percentage = (total_score / total_questions) * 100 if total_questions > 0 else 0

        return jsonify({
            "average_percentage": round(average_percentage, 2),
            "quiz_attempt_count": attempt_count,
        })

api.add_resource(QuizSummaryAPI, "/api/user/quiz-summary")

class SubjectStatsService:

    @staticmethod
    def get_subject_top_scores():
        results = db.session.execute(text("""
            SELECT subject.name, MAX(score.total_scored) AS top_score 
            FROM score
            JOIN quiz ON score.quiz_id = quiz.id
            JOIN chapter ON quiz.chapter_id = chapter.id
            JOIN subject ON chapter.subject_id = subject.id
            GROUP BY subject.name
        """)).fetchall()
        return [{"subject": row[0], "top_score": row[1]} for row in results]

    @staticmethod
    def get_subject_user_attempts():
        results = db.session.execute(text("""
            SELECT subject.name, COUNT(*) AS attempts 
            FROM score
            JOIN quiz ON score.quiz_id = quiz.id
            JOIN chapter ON quiz.chapter_id = chapter.id
            JOIN subject ON chapter.subject_id = subject.id
            GROUP BY subject.name
        """)).fetchall()
        return [{"subject": row[0], "attempts": row[1]} for row in results]


class SubjectTopScoresAPI(Resource):

    @auth_required() 
    def get(self):
        return jsonify(SubjectStatsService.get_subject_top_scores())


class SubjectUserAttemptsAPI(Resource):

    @auth_required()  
    def get(self):
        return jsonify(SubjectStatsService.get_subject_user_attempts())

api.add_resource(SubjectTopScoresAPI, '/api/admin/subject-top-scores')
api.add_resource(SubjectUserAttemptsAPI, '/api/admin/subject-user-attempts')



class UserListResource(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        search_query = request.args.get("search", "").strip()

        query = User.query
        if search_query:
            query = query.filter(
                (User.username.ilike(f"%{search_query}%")) |
                (User.email.ilike(f"%{search_query}%"))
            )

        users = query.all()
        return jsonify([
            {"id": u.id, "username": u.username, "email": u.email}
            for u in users
        ])
class SubjectListResource(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        search_query = request.args.get("search", "").strip()

        query = Subject.query
        if search_query:
            query = query.filter(Subject.name.ilike(f"%{search_query}%"))

        subjects = query.all()
        return jsonify([
            {"id": s.id, "name": s.name, "description": s.description}
            for s in subjects
        ])
class QuizListResource(Resource):
    @auth_required("token")
    @roles_required("admin")
    def get(self):
        search_query = request.args.get("search", "").strip()

        query = Quiz.query
        if search_query:
            query = query.filter(Quiz.remarks.ilike(f"%{search_query}%"))

        quizzes = query.all()
        return jsonify([
            { "id": quiz.id,
                 "num_questions": Question.query.filter_by(quiz_id=quiz.id).count(),
                "chapter_id": quiz.chapter_id,
                "date_of_quiz": quiz.date_of_quiz,
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks}
            for quiz in quizzes
        ])
api.add_resource(UserListResource, "/api/admin/users/search")
api.add_resource(SubjectListResource, "/api/subjects/search")
api.add_resource(QuizListResource, "/api/quizzes/search")
