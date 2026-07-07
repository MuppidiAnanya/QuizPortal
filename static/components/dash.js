export default {
    template: `
    <div class="container">
        <h2 class="mt-3">User Dashboard</h2>
        <p>Welcome, {{ userdata.email }}</p>
        <br>
         <div class="mb-3">
            <input type="text" v-model="searchQuery" placeholder="Search Quizzes by Subject" class="form-control">
        </div>
            

        <br>
        <h3 class="mt-4">Available Quizzes</h3>
        <table v-if="quizzes.length" class="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>No. of Questions</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="quiz in filteredQuizzes" :key="quiz.id">
                    <td>{{ quiz.id }}</td>
                    <td>{{ quiz.num_questions || 'N/A' }}</td>
                    <td>{{ quiz.date_of_quiz }}</td>
                    <td>{{ quiz.time_duration }}</td>
                    <td>
                        <button @click="viewQuiz(quiz)" class="btn btn-primary btn-sm">View</button>

                        <button @click="startQuiz(quiz)" class="btn btn-success btn-sm" :disabled="isQuizExpired(quiz)">Start</button>

                    </td>
                </tr>
            </tbody>
        </table>
        <p v-else>No quizzes available.</p>

        <!-- Quiz Details Modal -->
        <div class="modal fade" id="quizModal" tabindex="-1" aria-labelledby="quizModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="quizModalLabel">Quiz Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" >
                        <p>Quiz ID:{{ selectedQuiz.id }}</p>
                        <p>Subject: {{ selectedQuiz.subject || 'Loading' }}</p>
                        <p>Chapter: {{ selectedQuiz.chapter }}</p>
                        <p>No. of Questions: {{ selectedQuiz.num_questions }}</p>
                        <p>Date:{{ selectedQuiz.date_of_quiz }}</p>
                        <p>Duration:{{ selectedQuiz.time_duration }} minutes</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quiz Attempt Modal -->
        <div class="modal fade" id="quizAttemptModal" tabindex="-1" aria-labelledby="quizAttemptModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="quizAttemptModalLabel">Attempt Quiz</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p v-if="quizTimer !== null">Time Left: {{ quizTimer }} seconds</p>
                        <div v-for="(question, index) in selectedQuiz.questions" :key="question.id" class="mb-3">
                            <p><strong>Q{{ index + 1 }}:</strong> {{ question.question_statement }}</p>
                            <div v-for="(option, optIndex) in question.options" :key="optIndex">
                                <input type="radio" :id="'q' + question.id + '_opt' + optIndex" 
                                       :name="'q' + question.id" 
                                       :value="option" 
                                       v-model="userAnswers[question.id]">
                                <label :for="'q' + question.id + '_opt' + optIndex">{{ option }}</label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="submitQuiz" class="btn btn-primary">Submit</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>

       <div>
            <h2 class="mb-4">Past Quiz Attempts</h2>
            <div class="row-border">
                <div class="text-end">
                    <button class="btn btn-secondary" @click="csvexport">Download CSV</button>
                </div>
            </div>
            <table v-if="attempts.length" class="table table-striped">
                <thead>
                    <tr>
                        <th>Quiz ID</th>
                        <th>Quiz Name</th>
                        <th>Score</th>
                        <th>Attempt Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="attempt in attempts" :key="attempt.quiz_id">
                        <td>{{ attempt.quiz_id }}</td>
                        <td>{{ attempt.quiz_name }}</td>
                        <td>{{ attempt.score }}/{{ attempt.num_of_questions }}</td>
                        <td>{{ formatDate(attempt.timestamp) }}</td>
                    </tr>
                </tbody>
            </table>
            <p v-else>No past attempts found.</p>
        </div>


        <div>
    <h2 class="mt-4">Quiz Summary Report</h2>

    <div class="row">
        <div class="col-md-6">
            <h4>Average Percentage of Marks</h4>
            <canvas id="avgChart"></canvas>
        </div>
        <div class="col-md-6">
            <h4>Quizzes Attempted</h4>
            <canvas id="countChart"></canvas>
        </div>
    </div>
</div>

    </div>
    `,

    data() {
        return {
            userdata: "",
            quizzes: [],
            selectedQuiz: {},
            userAnswers: {},
            quizTimer: null,
            quizInterval: null,
            attempts: [],
            quizSummary: [], 
            avgPercentData: null,
            quizCountData: null,
            avgChartInstance: null,
            countChartInstance: null,
            searchQuery: "",
        
        };
    },
    computed: {
        filteredQuizzes() {
            if (!this.searchQuery) return this.quizzes;
    
            const filtered = this.quizzes.filter(quiz => {
                
                return quiz.subject.toLowerCase().includes(this.searchQuery.toLowerCase());
            });
    
            return filtered;
        }
    },

    mounted() {
        this.fetchUserData();
        this.fetchQuizzes();
        this.fetchUserAttempts();
        this.fetchQuizSummary();


    },

    methods: {
        fetchUserData() {
            fetch('/api/user', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => this.userdata = data)
            .catch(error => console.error("Error fetching user data:", error));
        },

        fetchQuizzes() {
            fetch('/api/admin/quiz', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log("Fetched quizzes:", data);
                this.quizzes = data;
            })
            .catch(error => console.error("Error fetching quizzes:", error));
        },

        viewQuiz(quiz) {
            this.selectedQuiz = quiz;

            fetch(`/api/quiz/${quiz.id}/details`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {

                this.selectedQuiz.subject = data.subject;
                this.selectedQuiz.chapter = data.chapter;
                this.selectedQuiz.num_questions = data.num_questions;
                
                this.$forceUpdate();
                this.$nextTick(() => {
                    let modal = new bootstrap.Modal(document.getElementById('quizModal'));
                    modal.show();
                });
            })
            .catch(error => console.error("Error fetching quiz details:", error));
        },
        startQuiz(quiz) {
            this.selectedQuiz = quiz;
            this.userAnswers = {};

            fetch(`/api/quiz/${quiz.id}/questions`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log("Fetched questions:", data);
                this.selectedQuiz.questions = data.questions;
                let [hours, minutes] = this.selectedQuiz.time_duration.split(":").map(Number);
                let totalMinutes = (hours * 60) + minutes;
                console.log("Converted quiz duration:", totalMinutes, "minutes");

                this.startTimer(totalMinutes * 60); 

                this.$nextTick(() => {
                    let modal = new bootstrap.Modal(document.getElementById('quizAttemptModal'));
                    modal.show();
                });
            })
            .catch(error => console.error("Error fetching quiz questions:", error));
        },

        startTimer(duration) {
            this.quizTimer = duration;
            this.quizInterval = setInterval(() => {
                if (this.quizTimer > 0) {
                    this.quizTimer--;
                } else {
                    clearInterval(this.quizInterval);
                    if (!this.quizSubmitted) {
                        this.submitQuiz(); 
                      }
                }
            }, 1000);
        },

    submitQuiz() {
        clearInterval(this.quizInterval);
    
        const results = this.selectedQuiz.questions.map(q => ({
            question_id: q.id,
            selected_option: this.userAnswers[q.id] || null  
        }));
    
        fetch(`/api/quiz/${this.selectedQuiz.id}/submit`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Authentication-Token": localStorage.getItem("auth_token")
            },
            body: JSON.stringify({ results })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Quiz submitted response:", data);
            alert(`Quiz Completed! Your score: ${data.score}`);
        })
        .catch(error => console.error("Error submitting quiz:", error));
    }, 

    fetchUserAttempts() {
        fetch('/api/user/quiz-attempts', {  
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authentication-Token": localStorage.getItem("auth_token")
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log("Fetched past attempts:", data);
    
            if (data && Array.isArray(data.attempts)) {
                this.attempts = data.attempts.map(attempt => {
                    const quiz = this.quizzes.find(q => q.id === attempt.quiz_id);
                    return {
                        ...attempt,
                        num_of_questions: quiz ? quiz.num_questions : "N/A"
                    };
                });
            } else {
                console.error("Unexpected response format:", data);
                this.attempts = [];
            }
        })
        .catch(error => console.error("Error fetching past attempts:", error));
    },
    csvexport(){
        fetch(`/api/export/${this.userdata.id}`)
        .then(response => response.json())
        .then(
            (data => {
               window.location.href =  `/api/csv_result/${data.id}`
            })
        )

    },
    formatDate(timestamp) {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    },

    fetchQuizSummary() {
        fetch('/api/user/quiz-summary', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authentication-Token": localStorage.getItem("auth_token")
            }
        })
        .then(response => response.json())
        .then(data => {
            this.quizSummary = [{
                email: "Current User", 
                total_score: data.average_percentage,
                total_possible_score: 100, 
                quizzes_attempted: data.quiz_attempt_count
            }];
        
            this.generateCharts();
        })
        .catch(error => console.error("Error fetching quiz summary:", error));
    },

    generateCharts() {
        if (this.quizSummary.length === 0) return;

        const labels = this.quizSummary.map(user => user.email);
        const avgMarks = this.quizSummary.map(user => 
            user.total_possible_score > 0 ? (user.total_score / user.total_possible_score) * 100 : 0
        );
        const quizCounts = this.quizSummary.map(user => user.quizzes_attempted);

        if (this.avgChartInstance) this.avgChartInstance.destroy();
        if (this.countChartInstance) this.countChartInstance.destroy();

        const avgCtx = document.getElementById('avgChart').getContext('2d');
        this.avgChartInstance = new Chart(avgCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Percentage (%)',
                    data: avgMarks,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });

        const countCtx = document.getElementById('countChart').getContext('2d');
        this.countChartInstance = new Chart(countCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quizzes Attempted',
                    data: quizCounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ]
                }]
            },
            options: { responsive: true }
        });
    },
    isQuizExpired(quiz) {
        if (!quiz.date_of_quiz) return true;
        
        const quizDate = new Date(quiz.date_of_quiz);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return quizDate < today; 
    },

    }
};
