export default {
    template: `
    <div>
    
    <br>
    <h2>Admin Dashboard</h2>
    <p>Welcome, {{ userdata.username }}</p>
    
    <h3>Users</h3>
    <div class="container">
    <input
        type="text"
        class="form-control mb-2"
        placeholder="Search users"
        v-model="userSearchQuery"
        @input="fetchUsers"
    />
    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.email }}</td>
        </tr>
      </tbody>
    </table>
  </div>
    <button class="btn btn-primary btn-lg" @click="openSubjectModal">Add Subject</button>
    <br><br>
    <div class="row">
    <input
    type="text"
    class="form-control mb-3"
    placeholder="Search subjects"
    v-model="subjectSearchQuery"
    @input="fetchSubjects"
/>

        <div v-for="subject in subjects" :key="subject.id" class="col-md-6">
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">{{ subject.name }}</h5>
                    <h6 class="card-subtitle mb-2 text-body-secondary">{{ subject.description }}</h6>
                    <button class="btn btn-outline-warning btn-sm" @click="editSubject(subject)">Edit</button>
                    <button class="btn btn-outline-danger btn-sm" @click="deleteSubject(subject.id)">Delete</button>

                    <table class="table">
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Chapter Name</th>
                                <th scope="col">Description</th>
                                <th scope="col">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="chapter in subject.chapters" :key="chapter.id">
                                <td>{{ chapter.id }}</td>
                                <td>{{ chapter.name }}</td>
                                <td>{{ chapter.description }}</td>
                                <td>
                                    <button class="btn btn-outline-warning btn-sm" @click="editChapter(subject.id, chapter)">Edit</button>
                                    <button class="btn btn-outline-danger btn-sm" @click="deleteChapter(subject.id, chapter.id)">Delete</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <button class="btn btn-success btn-sm mt-2" @click="openChapterModal(subject.id)">Add Chapter</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Subject Modal -->
    <div v-if="showSubjectModal" class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ editMode ? 'Edit Subject' : 'Add Subject' }}</h5>
                    <button type="button" class="btn-close" @click="closeModals"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="subjectName" class="form-label">Subject Name</label>
                        <input type="text" id="subjectName" class="form-control" v-model="subjectForm.name" required>
                    </div>
                    <div class="mb-3">
                        <label for="subjectDesc" class="form-label">Description</label>
                        <textarea id="subjectDesc" class="form-control" v-model="subjectForm.description"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="closeModals">Close</button>
                    <button type="button" class="btn btn-primary" @click="saveSubject">{{ editMode ? 'Update' : 'Add' }}</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Subject Modal Backdrop -->
    <div v-if="showSubjectModal" class="modal-backdrop fade show"></div>

    <!-- Chapter Modal -->
    <div v-if="showChapterModal" class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ editMode ? 'Edit Chapter' : 'Add Chapter' }}</h5>
                    <button type="button" class="btn-close" @click="closeModals"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="chapterName" class="form-label">Chapter Name</label>
                        <input type="text" id="chapterName" class="form-control" v-model="chapterForm.name" required>
                    </div>
                    <div class="mb-3">
                        <label for="chapterDesc" class="form-label">Description</label>
                        <textarea id="chapterDesc" class="form-control" v-model="chapterForm.description"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="closeModals">Close</button>
                    <button type="button" class="btn btn-primary" @click="saveChapter">{{ editMode ? 'Update' : 'Add' }}</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Chapter Modal Backdrop -->
    <div v-if="showChapterModal" class="modal-backdrop fade show"></div>

    <div class="container">
        <h2 class="mt-3">Admin Dashboard</h2>

        <div class="row">
            <div class="col-md-6">
                <h4>Top Scores by Subject</h4>
                <canvas id="topScoresChart"></canvas>
            </div>
            <div class="col-md-6">
                <h4>User Attempts by Subject</h4>
                <canvas id="userAttemptsChart"></canvas>
            </div>
        </div>
    </div>
</div>


    `,
    data() {
        return {
            users: [],
            userdata: {},
            subjects: [],
            showSubjectModal: false,
            showChapterModal: false,
            editMode: false,
            subjectForm: { id: null, name: "", description: "" },
            chapterForm: { id: null, subjectId: null, name: "", description: "" },
            topScoresData: [],
            userAttemptsData: [],
            topScoresChartInstance: null,
            userAttemptsChartInstance: null,
            userSearchQuery: "",
            subjectSearchQuery: "",

        };
    },
    mounted() {
        this.fetchAdminData();
        this.fetchSubjects();
        this.fetchUsers();
        this.fetchSubjectTopScores();
        this.fetchSubjectUserAttempts();
        

    },

    methods: {
        async fetchAdminData() {
            try {
                const response = await fetch('/api/admin', {
                    method: 'GET',
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    }
                });
                this.userdata = await response.json();
            } catch (error) {
                console.error("Error fetching admin data:", error);
            }
        },
        async fetchUsers() {
            try {
              const response = await fetch("/api/admin/users", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "Authentication-Token": localStorage.getItem("auth_token")
                }
              });
              if (!response.ok) throw new Error("Failed to fetch users");
      
              this.users = await response.json();
            } catch (error) {
              console.error("Error fetching users:", error);
            }
          },
        async fetchSubjects() {
            try {
                const response = await fetch('/api/subjects', {
                    method: 'GET',
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    }
                });
    
                const subjectsData = await response.json();
                this.subjects = await Promise.all(subjectsData.map(async subject => {
                    const chapters = await this.fetchChapters(subject.id);
                    return { ...subject, chapters };
                }));
            } catch (error) {
                console.error("Error fetching subjects:", error);
            }
        },
    
        async fetchChapters(subjectId) {
            try {
                const response = await fetch(`/api/subjects/${subjectId}/chapters`, {
                    method: 'GET',
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    }
                });
    
                const data = await response.json();
                return data.message ? [] : data;
            } catch (error) {
                console.error(`Error fetching chapters for subject ${subjectId}:`, error);
                return [];
            }
        },
    
        openSubjectModal() {
            this.subjectForm = { id: null, name: "", description: "" };
            this.editMode = false;
            this.showSubjectModal = true;
        },
    
        openChapterModal(subjectId, chapter = null) {
            if (chapter) {
                this.chapterForm = { id: chapter.id, subjectId, name: chapter.name, description: chapter.description };
                this.editMode = true;
            } else {
                this.chapterForm = { id: null, subjectId, name: "", description: "" };
                this.editMode = false;
            }
            this.showChapterModal = true;
        },
        
        
        editSubject(subject) {
            this.subjectForm = { 
                id: subject.id, 
                name: subject.name, 
                description: subject.description 
            };
            this.editMode = true;
            this.showSubjectModal = true; 
        },
        
        async saveSubject() {
            try {
                const url = this.editMode ? `/api/subjects/${this.subjectForm.id}` : `/api/subjects`;
                const method = this.editMode ? 'PUT' : 'POST';
    
                await fetch(url, {
                    method,
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    },
                    body: JSON.stringify({ name: this.subjectForm.name, description: this.subjectForm.description })
                });
    
                await this.fetchSubjects();
                this.closeModals();
            } catch (error) {
                console.error("Error saving subject:", error);
            }
        },
    
        async deleteSubject(subjectId) {
            if (!confirm("Are you sure you want to delete this subject?")) return;
    
            try {
                await fetch(`/api/subjects/${subjectId}`, {
                    method: 'DELETE',
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    }
                });
    
                await this.fetchSubjects();
            } catch (error) {
                console.error("Error deleting subject:", error);
            }
        },
    
        async saveChapter() {
            try {
                const url = this.editMode 
                    ? `/api/chapters/${this.chapterForm.id}` 
                    : `/api/subjects/${this.chapterForm.subjectId}/chapters`;
                const method = this.editMode ? 'PUT' : 'POST';
    
                const response = await fetch(url, {
                    method,
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    },
                    body: JSON.stringify({ name: this.chapterForm.name, description: this.chapterForm.description })
                });
    
                const data = await response.json();
    
                if (this.editMode) {
                    this.subjects = this.subjects.map(subject => {
                        if (subject.id === this.chapterForm.subjectId) {
                            subject.chapters = subject.chapters.map(chapter => 
                                chapter.id === this.chapterForm.id 
                                    ? { ...chapter, name: data.name, description: data.description }
                                    : chapter
                            );
                        }
                      
                        return subject;
                    });
                    await this.fetchSubjects();    
                } else {
                    await this.fetchSubjects();
                }
    
                this.closeModals();
            } catch (error) {
                console.error("Error saving chapter:", error);
            }
        },
        editChapter(subjectId, chapter) {
            this.chapterForm = { 
                id: chapter.id, 
                subjectId, 
                name: chapter.name, 
                description: chapter.description 
            };
            this.editMode = true;
            this.showChapterModal = true; 
        },
    
        async deleteChapter(subjectId, chapterId) {
            if (!confirm("Are you sure you want to delete this chapter?")) return;
    
            try {
                await fetch(`/api/chapters/${chapterId}`, {
                    method: 'DELETE',
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    }
                });
    
                this.subjects = this.subjects.map(subject => {
                    if (subject.id === subjectId) {
                        subject.chapters = subject.chapters.filter(chapter => chapter.id !== chapterId);
                    }
                    return subject;
                });
            } catch (error) {
                console.error("Error deleting chapter:", error);
            }
        },
    
        closeModals() {
            this.showSubjectModal = false;
            this.showChapterModal = false;
            this.subjectForm = { id: null, name: "", description: "" };
            this.chapterForm = { id: null, subjectId: null, name: "", description: "" };
        },


        fetchSubjectTopScores() {
            fetch('/api/admin/subject-top-scores', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                this.topScoresData = data;
                this.generateTopScoresChart();
            })
            .catch(error => console.error("Error fetching subject top scores:", error));
        },

        fetchSubjectUserAttempts() {
            fetch('/api/admin/subject-user-attempts', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                this.userAttemptsData = data;
                this.generateUserAttemptsChart();
            })
            .catch(error => console.error("Error fetching subject user attempts:", error));
        },

        generateTopScoresChart() {
            if (this.topScoresChartInstance) this.topScoresChartInstance.destroy();

            const labels = this.topScoresData.map(item => item.subject);
            const scores = this.topScoresData.map(item => item.top_score);

            const ctx = document.getElementById('topScoresChart').getContext('2d');
            this.topScoresChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Top Score',
                        data: scores,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        },

        generateUserAttemptsChart() {
            if (this.userAttemptsChartInstance) this.userAttemptsChartInstance.destroy();

            const labels = this.userAttemptsData.map(item => item.subject);
            const attempts = this.userAttemptsData.map(item => item.attempts);

            const ctx = document.getElementById('userAttemptsChart').getContext('2d');
            this.userAttemptsChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'User Attempts',
                        data: attempts,
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

        async fetchUsers() {
            try {
                const response = await fetch(`/api/admin/users/search?search=${encodeURIComponent(this.userSearchQuery)}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authentication-Token": localStorage.getItem("auth_token")
                    }
                });
        
                if (!response.ok) throw new Error("Failed to fetch users");
        
                this.users = await response.json();
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        },
        
        async fetchSubjects() {
            try {
                const response = await fetch(`/api/subjects/search?search=${encodeURIComponent(this.subjectSearchQuery)}`, {
                    method: "GET",
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authentication-Token": localStorage.getItem("auth_token") 
                    }
                });
        
                if (!response.ok) throw new Error("Failed to fetch subjects");
        
                const subjectsData = await response.json();
                this.subjects = await Promise.all(subjectsData.map(async subject => {
                    const chapters = await this.fetchChapters(subject.id);
                    return { ...subject, chapters };
                }));
            } catch (error) {
                console.error("Error fetching subjects:", error);
            }
        }
        
        
    }
    
};
