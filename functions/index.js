const { onRequest } = require("firebase-functions/v2/https");

// Basic helloWorld function
exports.helloWorld = onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

// Add your additional triggers or logic below as needed
// For example, handling Firestore triggers, HTTP requests, etc.
// const { onDocumentWritten } = require("firebase-functions/v2/firestore");
