export default {
    template: `
        <div>
            <br>
            <h2>Admin Dashboard - Quizzes</h2>

            <button class="btn btn-primary btn-lg" @click="openQuizModal">Add Quiz</button>
            <br><br>

            <div class="row">
                    <input
                    type="text"
                    class="form-control mb-3"
                    placeholder="Search Quizzes"
                    v-model="quizSearchQuery"
                    @input="getQuizzesSearch"/>
                <div v-for="quiz in quizzes" :key="quiz.id" class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Quiz: {{ quiz.id }}({{ quiz.remarks }})</h5>
                            <h6 class="card-subtitle mb-2 text-muted">Date: {{ quiz.date_of_quiz }} | Duration: {{ quiz.time_duration }}</h6>
                            <button class="btn btn-outline-warning btn-sm" @click="openQuizModal(quiz)">Edit</button>
                            <button class="btn btn-outline-danger btn-sm" @click="deleteQuiz(quiz.id)">Delete</button>
                            
                            <table class="table mt-2">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Question</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="question in quiz.questions" :key="question.id">
                                        <td>{{ question.id }}</td>
                                        <td>{{ question.question_statement }}</td>
                                        <td>
                                            <button class="btn btn-outline-warning btn-sm" @click="openQuestionModal(quiz.id, question)">Edit</button>
                                            <button class="btn btn-outline-danger btn-sm" @click="deleteQuestion(question.id)">Delete</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <button class="btn btn-success btn-sm mt-2" @click="openQuestionModal(quiz.id)">Add Question</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quiz Modal -->
            <div v-if="showQuizModal" class="modal fade show d-block">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ editMode ? 'Edit Quiz' : 'Add Quiz' }}</h5>
                            <button type="button" class="btn-close" @click="closeModals"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Chapter ID</label>
                                <input type="number" class="form-control" v-model="quizForm.chapter_id" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Quiz Title</label>
                                <input type="text" class="form-control" v-model="quizForm.remarks" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Date</label>
                                <input type="date" class="form-control" v-model="quizForm.date_of_quiz" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Duration (HH:MM)</label>
                                <input type="time" class="form-control" v-model="quizForm.time_duration" required>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="closeModals">Close</button>
                            <button class="btn btn-primary" @click="saveQuiz">{{ editMode ? 'Update' : 'Add' }}</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Question Modal -->
            <div v-if="showQuestionModal" class="modal fade show d-block">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ editMode ? 'Edit Question' : 'Add Question' }}</h5>
                            <button type="button" class="btn-close" @click="closeModals"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Question</label>
                                <input type="text" class="form-control" v-model="questionForm.question_statement" required>
                            </div>
                            <div class="mb-3" v-for="(option, index) in questionForm.options" :key="index">
                                <label class="form-label">Option {{ index + 1 }}</label>
                                <input type="text" class="form-control" v-model="questionForm.options[index]" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Correct Option (1-4)</label>
                                <input type="number" class="form-control" v-model="questionForm.correct_option" min="1" max="4" required>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="closeModals">Close</button>
                            <button class="btn btn-primary" @click="saveQuestion">{{ editMode ? 'Update' : 'Add' }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    data() {
        return {
            quizzes: [],
            showQuizModal: false,
            showQuestionModal: false,
            editMode: false,
            quizForm: { id: null, remarks: '', date_of_quiz: '', time_duration: '', chapter_id: '' },
            questionForm: { id: null ,question_statement: '', options: ['', '', '', ''], correct_option: 1 },
            selectedQuizId: null,
            quizSearchQuery: "",
        };
    },
    mounted() { this.getQuizzes(); },

    methods: {
        async getQuizzes() {
            try {
                const response = await fetch("/api/admin/quiz", {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "Authentication-Token": localStorage.getItem("auth_token") }
                });
                this.quizzes = await response.json();
                this.quizzes.forEach(quiz => {
                    this.$set(quiz, "questions", []);
                });
                for (const quiz of this.quizzes) {
                    await this.getQuestions(quiz.id);
                }
            } catch (error) {
                console.error("Error fetching quizzes:", error);
            }
        },

        openQuizModal(quiz = null) {
            if (quiz && quiz.id) {
                this.editMode = true;
                this.quizForm = { ...quiz };
            } else {
                this.editMode = false;
                this.quizForm = { id: null, remarks: '', date_of_quiz: '', time_duration: '', chapter_id: '' };
            }
            this.showQuizModal = true;
            
        },

        async saveQuiz() {
            const url = this.editMode ? `/api/admin/quiz/${this.quizForm.id}` : "/api/admin/quiz";
            const method = this.editMode ? "PUT" : "POST";
        
            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth_token")
                    },
                    body: JSON.stringify(this.quizForm)
                });
        
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Error saving quiz:", errorData);
                    alert(`Error: ${errorData.error || "Unknown error"}`);
                    return;
                }
                
                await this.getQuizzes();
                this.closeModals();
            } catch (error) {
                console.error("Error saving quiz:", error);
            }
        },
        
        
        

        async deleteQuiz(quizId) {
            if (!confirm("Are you sure you want to delete this quiz?")) return;

            try {
                await fetch(`/api/admin/quiz/${quizId}`, {
                    method: "DELETE",
                    headers: { "Authentication-Token": localStorage.getItem("auth_token") }
                });

                await this.getQuizzes();
            } catch (error) {
                console.error("Error deleting quiz:", error);
            }
        },
        async getQuestions(quizId) {
            try {
                const response = await fetch(`/api/admin/quiz/${quizId}/questions`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth_token")
                    }
                });
        
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Error fetching questions:", errorData);
                    alert(`Error: ${errorData.error || "Unknown error"}`);
                    return;
                }
        
                const questions = await response.json();
                

                const quizIndex = this.quizzes.findIndex(q => q.id === quizId);
                if (quizIndex !== -1) {
                    this.quizzes[quizIndex].questions = questions.length ?questions:[];
                }
            } catch (error) {
                console.error("Error fetching questions:", error);
            }
        }
        ,
        openQuestionModal(quizId, question = null) {
            this.selectedQuizId = quizId;
            this.editMode = !!question;
            this.questionForm = question ? { ...question } : { id: null, question_statement: '', options: ['', '', '', ''], correct_option: 1 };
            this.showQuestionModal = true;
        },

        async saveQuestion() {
            const url = this.editMode
                ? `/api/admin/question/${this.questionForm.id}`
                : `/api/admin/quiz/${this.selectedQuizId}/questions`;
            const method = this.editMode ? "PUT" : "POST";
        
            const questionPayload = {
                question_statement: this.questionForm.question_statement,
                option1: this.questionForm.options[0], 
                option2: this.questionForm.options[1],
                option3: this.questionForm.options[2],
                option4: this.questionForm.options[3],
                correct_option: parseInt(this.questionForm.correct_option) 
            };
            
            try {
                console.log("Saving Question:", JSON.stringify(questionPayload)); 
        
                const response = await fetch(url, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth_token"),
                    },
                    body: JSON.stringify(questionPayload),
                });
        
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Error saving question:", errorData);
                    alert(`Error: ${errorData.error || "Unknown error"}`);
                    return;
                }
        
                await this.getQuestions(this.selectedQuizId);
                this.closeModals();
            } catch (error) {
                console.error("Error saving question:", error);
            }
        },
        async deleteQuestion(questionId) {
            if (!confirm("Are you sure you want to delete this question?")) return;
        
            try {
                const response = await fetch(`/api/admin/question/${questionId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth_token")
                    }
                });
        
                const data = await response.json(); 
        
                if (!response.ok) {
                    console.error("Error deleting question:", data);
                    alert(`Error: ${data.error || "Failed to delete question"}`);
                    return;
                }
    
                this.quizzes.forEach(quiz => {
                    quiz.questions = quiz.questions.filter(q => q.id !== questionId);
                });
        
            } catch (error) {
                console.error("Error deleting question:", error);
            }
        },
        

        closeModals() { this.showQuizModal = false; this.showQuestionModal = false; },

        async getQuizzesSearch() {
            try {
                const response = await fetch(`/api/quizzes/search?search=${encodeURIComponent(this.quizSearchQuery)}`, {
                    method: "GET",
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    }
                });
        
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Error fetching quizzes:", errorData);
                    return;
                }
        
                this.quizzes = await response.json();
                this.quizzes.forEach(quiz => {
                    this.$set(quiz, "questions", []);
                });
        
                for (const quiz of this.quizzes) {
                    await this.getQuestions(quiz.id);
                }
            } catch (error) {
                console.error("Error fetching quizzes:", error);
            }
        },
        
        
    },

   
};
