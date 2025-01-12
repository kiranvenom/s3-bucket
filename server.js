const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const UPLOAD_DIR = process.env.UPLOAD_DIR;

// Ensure upload directory exists
fs.ensureDirSync(UPLOAD_DIR);

// Configure CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, UPLOAD_DIR);
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});
const upload = multer({ storage });

// API to upload files
app.post('/upload', upload.array('files', 10), (req, res) => {
	// Check if files are uploaded
	if (!req.files || req.files.length === 0) {
		return res.status(400).json({ error: 'No files uploaded' });
	}

	// Create an array of file paths for the uploaded files
	const filePaths = req.files.map((file) => ({
		originalName: file.originalname,
		filePath: `${file.filename}`,
	}));

	// Send a response with the uploaded file paths
	res.status(200).json({
		message: 'Files uploaded successfully',
		files: filePaths,
	});
});

// API to serve uploaded files
app.get('/files/:filename', (req, res) => {
	const filePath = `${UPLOAD_DIR}/${req.params.filename}`;
	if (!fs.existsSync(filePath)) {
		return res.status(404).json({ error: 'File not found' });
	}
	res.sendFile(filePath, { root: '.' });
});

// API to list all files
app.get('/files', (req, res) => {
	const files = fs.readdirSync(UPLOAD_DIR).map((file) => ({
		name: file,
		url: `/files/${file}`,
	}));
	res.status(200).json(files);
});

app.delete('/files/:filename', (req, res) => {
	const filePath = `${UPLOAD_DIR}/${req.params.filename}`;

	// Check if the file exists
	if (!fs.existsSync(filePath)) {
		return res.status(404).json({ error: 'File not found' });
	}

	// Attempt to delete the file
	fs.unlink(filePath, (err) => {
		if (err) {
			return res.status(500).json({ error: 'Failed to delete file' });
		}
		res.status(200).json({ message: 'File deleted successfully' });
	});
});

app.get('/status', (req, res) => {
	res.send({
		message: true,
		error: false,
	});
});

// Start server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
