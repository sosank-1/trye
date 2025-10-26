// Firebase Configuration (Replace with your actual config from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCB4KKQB00xV3iuBEYpvv6JiVJDywDDXHw",
  authDomain: "masai-hackathon-5b3f3.firebaseapp.com",
  projectId: "masai-hackathon-5b3f3",
  storageBucket: "masai-hackathon-5b3f3.firebasestorage.app",
  messagingSenderId: "58793644741",
  appId: "1:58793644741:web:cb8cb559d0adb6990916ac",
  measurementId: "G-L009KDQ3J6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Global variables for issues (we'll load from Firestore)
let myReportsData = [];
let publicDashboardData = [];

// Check sign-in status (Firebase handles persistence automatically)
function checkSignInStatus() {
  auth.onAuthStateChanged(user => {
    if (user) {
      // User is signed in
      const userData = {
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email
      };
      showSignedInState(userData);
      showMainApp();
      loadUserIssues(user.uid); // Load user's issues from Firestore
    } else {
      // User is signed out
      showSignedOutState();
      showSignInPage();
    }
  });
}

// Load user's issues from Firestore
async function loadUserIssues(userId) {
  try {
    const querySnapshot = await db.collection('issues').where('userId', '==', userId).get();
    myReportsData = [];
    querySnapshot.forEach(doc => {
      myReportsData.push({ id: doc.id, ...doc.data() });
    });
    renderIssues('myReportsList', myReportsData);
    updateStats();
  } catch (error) {
    console.error('Error loading issues:', error);
  }
}

// Load public issues (resolved ones)
async function loadPublicIssues() {
  try {
    const querySnapshot = await db.collection('issues').where('status', '==', 'resolved').get();
    publicDashboardData = [];
    querySnapshot.forEach(doc => {
      publicDashboardData.push({ id: doc.id, ...doc.data() });
    });
    renderIssues('publicDashboardList', publicDashboardData);
  } catch (error) {
    console.error('Error loading public issues:', error);
  }
}

// Show signed in state
function showSignedInState(userData) {
  document.getElementById('signedInUser').classList.remove('hidden');
  document.getElementById('notSignedIn').classList.add('hidden');
  
  // Update user info
  document.getElementById('userAvatar').textContent = userData.name.charAt(0).toUpperCase();
  document.getElementById('userName').textContent = userData.name;
}

// Show signed out state
function showSignedOutState() {
  document.getElementById('signedInUser').classList.add('hidden');
  document.getElementById('notSignedIn').classList.remove('hidden');
}

// Show sign in page
function showSignInPage() {
  document.getElementById('signInPage').classList.remove('hidden');
  document.getElementById('signUpPage').classList.add('hidden');
  document.getElementById('forgotPasswordPage').classList.add('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

// Show sign up page
function showSignUpPage() {
  document.getElementById('signInPage').classList.add('hidden');
  document.getElementById('signUpPage').classList.remove('hidden');
  document.getElementById('forgotPasswordPage').classList.add('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

// Show forgot password page
function showForgotPasswordPage() {
  document.getElementById('signInPage').classList.add('hidden');
  document.getElementById('signUpPage').classList.add('hidden');
  document.getElementById('forgotPasswordPage').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

// Show main app
function showMainApp() {
  document.getElementById('signInPage').classList.add('hidden');
  document.getElementById('signUpPage').classList.add('hidden');
  document.getElementById('forgotPasswordPage').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  
  // Load public issues
  loadPublicIssues();
}

// Navigation functions
function goToSignIn() {
  showSignInPage();
}

function goToSignUp() {
  showSignUpPage();
}

function showForgotPassword() {
  showForgotPasswordPage();
}

function goToHomePage() {
  if (auth.currentUser) {
    showMainApp();
  } else {
    showSignInPage();
  }
}

// Sign in form submission
document.getElementById('signInForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('signInEmail').value;
  const password = document.getElementById('signInPassword').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showNotification("Sign in successful!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
});

// Google Sign In
async function signInWithGoogle() {
  console.log("Google sign in function called");

  if (!auth) {
    console.error("Firebase auth not initialized");
    showNotification("Authentication not initialized", "error");
    return;
  }

  if (!googleProvider) {
    console.error("Google provider not initialized");
    showNotification("Google provider not configured", "error");
    return;
  }

  try {
    console.log("Setting up Google provider...");
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log("Attempting Google sign in popup...");
    const result = await auth.signInWithPopup(googleProvider);
    console.log("Google sign in result received:", result);

    if (result.user) {
      console.log("User authenticated:", result.user);
      showNotification("Google sign in successful!", "success");
    } else {
      console.error("No user in result");
      showNotification("Sign in failed - no user data", "error");
    }

  } catch (error) {
    console.error("Google sign in error details:", {
      code: error.code,
      message: error.message,
      email: error.email,
      credential: error.credential
    });

    let errorMessage = "Google sign in failed";
    if (error.code === 'auth/popup-blocked') {
      errorMessage = "Popup was blocked. Please allow popups for this site.";
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = "Sign in cancelled.";
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = "Another popup is already open.";
    }

    showNotification(errorMessage + ": " + error.message, "error");
  }
}

// Sign up form submission
document.getElementById('signUpForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const name = document.getElementById('signUpName').value;
  const email = document.getElementById('signUpEmail').value;
  const password = document.getElementById('signUpPassword').value;
  const confirmPassword = document.getElementById('signUpConfirmPassword').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;
  
  // Validation
  if (!name || !email || !password || !confirmPassword) {
    showNotification("Please fill in all fields", "error");
    return;
  }
  
  if (password !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    return;
  }
  
  if (!agreeTerms) {
    showNotification("You must agree to the terms and conditions", "error");
    return;
  }
  
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName: name });
    
    // Save user data to Firestore
    await db.collection('users').doc(userCredential.user.uid).set({
      name: name,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showNotification("Account created successfully! Welcome to CivicConnect, " + name + "!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
});

// Forgot password form submission
document.getElementById('forgotPasswordForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('forgotPasswordEmail').value;
  
  if (email) {
    try {
      await auth.sendPasswordResetEmail(email);
      showNotification("Password reset link sent to " + email, "success");
      setTimeout(() => {
        goToSignIn();
      }, 2000);
    } catch (error) {
      showNotification(error.message, "error");
    }
  } else {
    showNotification("Please enter your email address", "error");
  }
});

// Sign out
function signOut() {
  auth.signOut();
  showNotification("You have been signed out", "info");
}

// Set up event listeners for main app
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      switchTab(parseInt(tabId));
    });
  });
  
  // Navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const tabId = this.getAttribute('data-tab');
      switchTab(parseInt(tabId));
    });
  });
  
  // Hero report button
  document.getElementById('heroReportBtn').addEventListener('click', function(e) {
    e.preventDefault();
    switchTab(0);
  });
  
  // Form submission
  document.getElementById('issueForm').addEventListener('submit', function(e) {
    e.preventDefault();
    submitIssue();
  });
  
  // File upload label update
  document.getElementById('photoUpload').addEventListener('change', function() {
    const fileName = this.files[0]?.name || 'Click to upload or drag and drop';
    const label = document.querySelector('.file-upload-label span');
    label.textContent = fileName;
  });
  
  // Filter and search for My Reports
  document.getElementById('statusFilter').addEventListener('change', function() {
    filterMyReports();
  });
  
  document.getElementById('myReportsSearch').addEventListener('input', function() {
    filterMyReports();
  });
  
  // Filter and search for Public Dashboard
  document.getElementById('resolvedFilter').addEventListener('change', function() {
    filterPublicDashboard();
  });
  
  document.getElementById('publicDashboardSearch').addEventListener('input', function() {
    filterPublicDashboard();
  });
  
  // Stat cards click
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      document.getElementById('statusFilter').value = filter;
      filterMyReports();
    });
  });
}

// Switch tab
function switchTab(tabId) {
  // Update active tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`.nav-link[data-tab="${tabId}"]`).classList.add('active');
  
  // Update active content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`tab-${tabId}`).classList.add('active');
  
  // If map tab is active and map is loaded, resize map to fix display issues
  if (tabId === 0 && mapLoaded && map) {
    setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
    }, 100);
  }
}

// Render issues
function renderIssues(containerId, issues) {
  const container = document.getElementById(containerId);
  
  if (issues.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No issues found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = issues.map(issue => `
    <div class="issue-card" onclick="showIssueDetails('${issue.id}')">
      <div class="issue-header">
        <span class="issue-type ${issue.type}">${issue.typeName}</span>
        <div class="issue-status">
          <span class="status-icon status-${issue.status}"></span>
          ${issue.statusName}
        </div>
      </div>
      <div class="issue-details">
        <h3>${issue.title}</h3>
        <p>${issue.description}</p>
      </div>
      <img src="${issue.image}" alt="${issue.title}" class="issue-image">
      <div class="issue-meta">
        <span><i class="fas fa-calendar-alt"></i> Reported: ${issue.date}</span>
        <span><i class="fas fa-map-marker-alt"></i> ${issue.location}</span>
      </div>
    </div>
  `).join('');
}

// Filter My Reports
function filterMyReports() {
  const statusFilter = document.getElementById('statusFilter').value;
  const searchTerm = document.getElementById('myReportsSearch').value.toLowerCase();
  
  const filteredIssues = myReportsData.filter(issue => {
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm) || 
                        issue.description.toLowerCase().includes(searchTerm) ||
                        issue.location.toLowerCase().includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });
  
  renderIssues('myReportsList', filteredIssues);
}

// Filter Public Dashboard
function filterPublicDashboard() {
  const typeFilter = document.getElementById('resolvedFilter').value;
  const searchTerm = document.getElementById('publicDashboardSearch').value.toLowerCase();
  
  const filteredIssues = publicDashboardData.filter(issue => {
    const matchesType = typeFilter === 'all' || issue.type === typeFilter;
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm) || 
                        issue.description.toLowerCase().includes(searchTerm) ||
                        issue.location.toLowerCase().includes(searchTerm);
    
    return matchesType && matchesSearch;
  });
  
  renderIssues('publicDashboardList', filteredIssues);
}

// Submit issue
async function submitIssue() {
  if (!auth.currentUser) {
    showNotification("Please sign in to report an issue", "error");
    return;
  }
  
  // Get form values
  const issueType = document.getElementById('issueType').value;
  const issueDescription = document.getElementById('issueDescription').value;
  const locationAddress = document.getElementById('locationAddress').value;
  
  // Basic validation
  if (!issueType) {
    showNotification("Please select an issue type", "error");
    return;
  }
  
  if (!issueDescription) {
    showNotification("Please provide a description of the issue", "error");
    return;
  }
  
  if (!locationAddress) {
    showNotification("Please provide a location for the issue", "error");
    return;
  }
  
  try {
    // Save to Firestore
    const docRef = await db.collection('issues').add({
      userId: auth.currentUser.uid,
      type: issueType,
      typeName: issueType.charAt(0).toUpperCase() + issueType.slice(1),
      title: issueDescription.substring(0, 50) + (issueDescription.length > 50 ? '...' : ''),
      description: issueDescription,
      status: 'pending',
      statusName: 'Pending',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: locationAddress,
      image: 'https://images.unsplash.com/photo-1558952011-2841bf893c3c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Add to local array
    const newIssue = {
      id: docRef.id,
      userId: auth.currentUser.uid,
      type: issueType,
      typeName: issueType.charAt(0).toUpperCase() + issueType.slice(1),
      title: issueDescription.substring(0, 50) + (issueDescription.length > 50 ? '...' : ''),
      description: issueDescription,
      status: 'pending',
      statusName: 'Pending',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: locationAddress,
      image: 'https://images.unsplash.com/photo-1558952011-2841bf893c3c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    };
    
    myReportsData.unshift(newIssue);
    
    // Update stats
    updateStats();
    
    // Re-render my reports
    filterMyReports();
    
    // Reset form
    document.getElementById('issueForm').reset();
    document.querySelector('.file-upload-label span').textContent = 'Click to upload or drag and drop';
    
    // Reset map and location info
    if (marker) {
      marker.setVisible(false);
    }
    document.getElementById('locationInfo').style.display = 'none';
    selectedLocation = null;
    
    showNotification("Issue reported successfully!", "success");
  } catch (error) {
    showNotification("Error reporting issue: " + error.message, "error");
  }
}

// Update statistics
function updateStats() {
  const pendingCount = myReportsData.filter(issue => issue.status === 'pending').length;
  const inProgressCount = myReportsData.filter(issue => issue.status === 'in-progress').length;
  const resolvedCount = myReportsData.filter(issue => issue.status === 'resolved').length;
  const totalCount = myReportsData.length;
  
  document.getElementById('totalIssues').textContent = totalCount;
  document.getElementById('pendingIssues').textContent = pendingCount;
  document.getElementById('inProgressIssues').textContent = inProgressCount;
  document.getElementById('resolvedIssues').textContent = resolvedCount;
}

// Show issue details (placeholder)
function showIssueDetails(issueId) {
  // This would typically open a modal or navigate to a detail page
  console.log('Showing details for issue:', issueId);
}

// Show notification
function showNotification(message, type) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');

  if (notification && notificationMessage) {
    notificationMessage.textContent = message;
    notification.classList.remove('error', 'success', 'info');
    notification.classList.add(type);
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  checkSignInStatus();
});
