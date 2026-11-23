
function toggleMenu() {

    const nav = document.getElementById("navLinks");

    nav.classList.toggle("active");

}

// Close menu after clicking a navigation link

document.querySelectorAll(".nav-links a").forEach(link => {

    link.addEventListener("click", () => {

        document.getElementById("navLinks")
            .classList.remove("active");

    });

});

const API_URL = "http://127.0.0.1:8000";

// Participant code is used to identify the registered user.
const getCode = () => localStorage.getItem("participantCode");


// --------------------------------
// SHOW AND HIDE PANELS
// --------------------------------

function showPanel(panelId) {

    if (panelId !== "registerPanel" && !getCode()) {

        alert("Please register for the event first.");
        showPanel("registerPanel");
        return;
    }

    document.querySelectorAll(".panel").forEach(panel => {
        panel.hidden = true;
    });

    document.getElementById(panelId).hidden = false;

}


// --------------------------------
// API REQUEST HELPER
// --------------------------------

async function apiRequest(endpoint, method = "GET", data = null) {

    const headers = {};

    if (getCode()) {
        headers["X-Participant-Code"] = getCode();
    }

    if (data !== null) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(API_URL + endpoint, {
        method,
        headers,
        body: data === null ? undefined : JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        const error = result.detail;
        throw new Error(
            typeof error === "string"
                ? error
                : "Request failed. Please check your details."
        );
    }

    return result;
}


// --------------------------------
// 1. REGISTER PARTICIPANT
// --------------------------------

const registrationForm =
    document.getElementById("registrationForm");

registrationForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const button = document.getElementById("registerSubmit");
    const resultBox = document.getElementById("participantResult");

    button.disabled = true;
    button.textContent = "Registering...";

    try {

        const data = Object.fromEntries(
            new FormData(registrationForm).entries()
        );

        const result = await apiRequest(
            "/register",
            "POST",
            data
        );

        // Save the participant credential locally
        localStorage.setItem(
            "participantCode",
            result.participant_code
        );

        resultBox.innerHTML = `
            <div class="result-card">
                <h3>Registration Successful!</h3>
                <p>Your unique participant code:</p>

                <span class="unique-code">
                    ${result.participant_code}
                </span>

                <button class="copy-btn"
                    onclick="copyCode('participantCode')">
                    Copy Participant Code
                </button>

                <p>Keep this code private.
                You will need it to manage your team.</p>
            </div>
        `;

        registrationForm.reset();

        document.getElementById("registerAction").hidden = true;

        await refreshTeam();

    } catch(error) {

        resultBox.textContent = error.message;

    } finally {

        button.disabled = false;
        button.textContent = "Complete Registration";

    }

});


// --------------------------------
// 2. CREATE TEAM
// --------------------------------

const createTeamForm =
    document.getElementById("createTeamForm");

createTeamForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const resultBox = document.getElementById("createResult");

    try {

        const data = Object.fromEntries(
            new FormData(createTeamForm).entries()
        );

        const result = await apiRequest(
            "/team/create",
            "POST",
            data
        );

        // Save invitation code for the team creator
        localStorage.setItem("myTeamCode", result.team_code);

        resultBox.innerHTML = `
            <div class="result-card">

                <h3>Team Created Successfully!</h3>

                <p>Team Name: ${escapeHTML(result.team_name)}</p>

                <p>Share this unique team code with your friends:</p>

                <span class="unique-code">
                    ${result.team_code}
                </span>

                <button class="copy-btn"
                    onclick="copyCode('myTeamCode')">
                    Copy Team Code
                </button>

                <p>Current Members: 1 / 4</p>

            </div>
        `;

        createTeamForm.reset();

        await refreshTeam();

    } catch(error) {

        resultBox.textContent = error.message;

    }

});


// --------------------------------
// 3. JOIN TEAM
// --------------------------------

const joinTeamForm =
    document.getElementById("joinTeamForm");

joinTeamForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const resultBox = document.getElementById("joinResult");

    try {

        const data = Object.fromEntries(
            new FormData(joinTeamForm).entries()
        );

        const result = await apiRequest(
            "/team/join",
            "POST",
            data
        );

        resultBox.innerHTML = `
            <div class="result-card">
                <h3>Successfully Joined!</h3>
                <p>Team: ${escapeHTML(result.team_name)}</p>
                <p>Members: ${result.member_count} / 4</p>
            </div>
        `;

        joinTeamForm.reset();

        await refreshTeam();

    } catch(error) {

        resultBox.textContent = error.message;

    }

});


// --------------------------------
// 4. VIEW TEAM DETAILS
// --------------------------------

async function refreshTeam() {

    const code = getCode();

    const leaveButton = document.getElementById("leaveButton");

    const teamPanel = document.getElementById("teamPanel");

    const teamDetails = document.getElementById("teamDetails");

    const registerAction = document.getElementById("registerAction");

    const createAction = document.getElementById("createAction");

    const joinAction = document.getElementById("joinAction");

    if (!code) {

        leaveButton.hidden = true;
        return;
    }

    try {

        const result = await apiRequest("/team/me");

        registerAction.hidden = true;

        if (result.in_team) {
            document.getElementById("registerPanel").hidden = true;
            document.getElementById("createPanel").hidden = true;
            document.getElementById("joinPanel").hidden = true;

            leaveButton.hidden = false;

            createAction.hidden = true;
            joinAction.hidden = true;

            teamPanel.hidden = false;

            const membersHTML = result.members.map(member => `
                <li>${escapeHTML(member.name)}</li>
            `).join("");

            const invitationCode = localStorage.getItem("myTeamCode");

            teamDetails.innerHTML = `
                <div class="result-card">

                    <h3>${escapeHTML(result.team_name)}</h3>

                    <p>
                        Members: ${result.member_count} / 4
                    </p>

                    <h4>Team Members</h4>

                    <ul class="member-list">
                        ${membersHTML}
                    </ul>

                    ${invitationCode ? `
                        <p>Your team invitation code:</p>
                        <span class="unique-code">
                            ${escapeHTML(invitationCode)}
                        </span>
                        <button class="copy-btn"
                            onclick="copyCode('myTeamCode')">
                            Copy Team Code
                        </button>
                    ` : ""}

                    ${result.is_creator
                        ? "<p>You are the team creator.</p>"
                        : ""}
                </div>
            `;

        } else {

            leaveButton.hidden = true;

            createAction.hidden = false;
            joinAction.hidden = false;

            teamPanel.hidden = true;

            localStorage.removeItem("myTeamCode");

        }

    } catch(error) {

        console.error("Team status error:", error);

    }

}


// --------------------------------
// 5. LEAVE TEAM
// --------------------------------

async function leaveTeam() {

    const confirmed = confirm(
        "Are you sure you want to leave your current team?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const result = await apiRequest(
            "/team/leave",
            "POST"
        );

        localStorage.removeItem("myTeamCode");

        alert(result.message);

        await refreshTeam();

        showPanel("registerPanel");

    } catch(error) {

        alert(error.message);

    }

}


// --------------------------------
// 6. COPY UNIQUE CODES
// --------------------------------

async function copyCode(key) {

    const code = localStorage.getItem(key);

    if (!code) return;

    try {
        await navigator.clipboard.writeText(code);
        alert("Code copied successfully!");
    } catch {
        alert("Unable to copy. Please copy the code manually.");
    }

}


// --------------------------------
// 7. SAFE TEXT DISPLAY
// --------------------------------

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

}


// --------------------------------
// 8. CHECK LOGIN/TEAM STATUS
// --------------------------------

document.addEventListener("DOMContentLoaded", async () => {

    if (getCode()) {

        document.getElementById("registerAction").hidden = true;

        await refreshTeam();

    }

});

