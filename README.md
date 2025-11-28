Real-Time File Sharing Web Application

A Modern Socket-Based File Sharing Platform with React and Node.js

Project Overview

This File Sharing Application is a real-time web platform developed using React.js (Frontend) and Node.js with Express and Socket.io (Backend). It enables users to create or join private lobbies and instantly share files using real-time communication channels.

The project was originally forked from an older repository, but the backend and frontend have been significantly improved, debugged, and reconnected to ensure stable file transfers, functional sockets, and smooth user experience.

Features

Real-time Lobby Creation
• Unique lobby IDs are generated dynamically
• Multiple users can join the same lobby

Instant File Sharing
• Files are uploaded and streamed to the server using Socket.io
• Download links are generated instantly for all lobby members

Improved Backend with Stable Socket Connections
• Fixed socket disconnection and “Socket not connected” issues
• Updated namespace logic for reliable room-based communication

Modern UI / UX
• Developed using React.js and React-Bootstrap
• Simple, responsive and minimal interface

File Management
• Uploaded files are temporarily stored on the server
• Auto-deletion after 30 minutes for security

Tech Stack

Frontend
• React.js (Hooks)
• React-Bootstrap
• Axios
• Socket.io Client
• socket.io-stream

Backend
• Node.js
• Express.js
• Socket.io
• socket.io-stream
• UUID for lobby generation

Improvements Made in the Forked Project

Backend Enhancements
• Fixed broken socket connection issues
• Rewrote namespace logic for better lobby handling
• Ensured backend properly receives and streams uploaded files
• Connected backend API with the React frontend
• Added error logging for debugging

Frontend Enhancements
• Updated endpoints to match server
• Fixed lobby join interface flow
• Improved file upload component
• Enhanced UI structure and responsiveness

General Improvements
• Cleaned unused code and warnings
• Organized folder structure
• Added comments for better clarity
• Prepared the project for deployment

Installation and Setup

Step 1: Clone the project
Clone the repository and open the project folder.

Step 2: Install server dependencies
Navigate to the server folder and install dependencies with npm install.

Step 3: Install client dependencies
Navigate to the client folder and install dependencies with npm install.

Step 4: Run Backend
Start the backend server with node server.js.

Step 5: Run Frontend
Start the React frontend using npm start inside the client folder.

How It Works

A user creates a lobby.

A unique lobby ID is generated (for example: lobby-1764362801900).

Other users enter the same ID to join the lobby.

When a file is selected, it is streamed to the server and the server immediately sends download links to all connected clients in the lobby.

Future Enhancements

• Authentication (JWT + Cookies)
• Two-way streaming for simultaneous upload and download
• Deployment to cloud platforms (Vercel, Render, Google Cloud)
• File encryption for security
• Real-time chat system inside the lobby
