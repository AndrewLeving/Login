const URL = "https://forum2022.codeschool.cloud"

Vue.component('thread-preview', {
    template: `<div class="thread-preview">
    <div class="thread-preview-header">
        <h1 @click="goToThread()"> {{ thread.name }} </h1>
        <h3> {{ thread.category }} </h3>
    </div>
    <p> {{ thread.description }} </p>
    </div>`,
    props: ['thread'],
    methods: {
        goToThread: function () {
            this.$emit('go')
        }
    }
});

Vue.component('post', {
    template: `
    <div class="post">
        <p> {{ post.body }} </p>
        <div class="post-footer">
            <h3> {{ post.user.fullname }} </h3>
        </div>
    </div>`,
    props: ['post'],
});

var app = new Vue({
    el: '#app',
    data: {
        page: "login",
        loginEmail: "",
        loginPassword: "",

        newUsername: "",
        newEmail: "",
        newPassword: "",

        errorMessage: "",
        accountMessage: "",

        threadList: [],
        activeThread: {},
    },
    methods: {

        //Get /session - ask the server if we are logged in
        getSession: async function () {
            let response = await fetch(`${URL}/session`, {
                method: "GET",
                credentials: "include"
            });
            //Are we logged in?
            if (response.status == 200) {
                //logged in
                this.page = "home"
                this.getThread()
            }
            else if (response.status == 401) {
                //not logged in
                let data = await response.json();
                console.log(data);
                this.page = "login"
            }
            else {
                console.log("Error GETTING /session", response.status, response);
            }
        },
        postSession: async function () {
            let loginCreds = {
                username: this.loginEmail,
                password: this.loginPassword
            };

            let response = await fetch(`${URL}/session`, {
                method: "POST",
                body: JSON.stringify(loginCreds),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"

            });

            if (response.status == 201) {
                //logged in

                this.loginEmail = "";
                this.loginPassword = "";
                this.errorMessage = "";
                this.page = "home"
                this.getThread();
            }
            else if (response.status == 401) {
                //not logged in
                this.loginPassword = "";
                this.errorMessage = "Incorrect username or password";
            }
            else if (response.status == 400) {
                //no info entered
                this.loginPassword = "";
                this.errorMessage = "Please enter a username and password";
            }
            else {
                console.log("Error POSTING /session", response.status, response);
            }
        },

        postUser: async function () {
            let loginCreds = {
                fullname: this.newUsername,
                username: this.newEmail,
                password: this.newPassword
            };

            let response = await fetch(`${URL}/user`, {
                method: "POST",
                body: JSON.stringify(loginCreds),
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"

            });
            console.log(response);

            if (response.status == 201) {
                this.accountMessage = "Account created. You may now login";
                this.page = "login";
                this.loginEmail = "";
                this.loginPassword = "";
                this.errorMessage = "";
            }
            else {
                let body = await response.json();
                this.errorMessage = body.error.message;
            }
        },
        getThread: async function () {
            let response = await fetch(`${URL}/thread`, {
                method: "GET",
                credentials: "include",
            });
            if (response.status == 200) {
                let data = await response.json();
                this.threadList = data;
            }
            else {
                this.threadList = ["ERROR FETCHING THREAD DATA"]
            }
        },
        getThreadID: async function (id) {
            let response = await fetch(`${URL}/thread/${id}`, {
                method: "GET",
                credentials: "include",
            });
            if (response.status == 200) {
                let data = await response.json();
                this.activeThread = data;
            }
            else {
                this.activeThread = ["ERROR FETCHING THREAD DATA"]
            }
        },

        goToSignUp: function () {
            this.page = 'signup';
            this.errorMessage = ''
            this.loginEmail = "";
            this.loginPassword = "";
        },
        goToLogin: function () {
            this.page = 'login';
            this.errorMessage = '';
            this.newUsername = ""
            this.newEmail = "";
            this.newPassword = "";
        },
        goToThread: function (id) {
            this.getThreadID(id);
            this.page = "thread";
        }

    },
    created: function () {
        this.getSession();
    }
});